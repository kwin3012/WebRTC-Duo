let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')
if(!roomId){
    window.location = 'index.html'
}

let divSelectRoom = document.getElementById('selectRoom')
let divConsultingRoom = document.getElementById('consultingRoom')
let inputRoomNumber = document.getElementById('roomNumber')
let btnGoRoom = document.getElementById('goRoom')
let localVideo = document.getElementById('localVideo')
let remoteVideo = document.getElementById('remoteVideo')

let btnSendMessage = document.getElementById("sendMessage")
let texts = document.getElementById("msger-chat");

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller, p;

const iceServers = {
    'iceServer' : [
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
}

const streamConstraints = {
    audio:true,
    video:true
} 

const socket = io()

roomNumber = roomId
socket.emit('join',roomNumber)
divConsultingRoom.style = 'display:block';


btnSendMessage.onclick = () => {
    if(dataChannelSend.value === ''){
        alert('please type a call name!')
    } else {
        // for sending message
        dataChannel.send(dataChannelSend.value)

         p = `<div class="msg right-msg">
        <div class="msg-bubble">
          <div class="msg-info">
            <div class="msg-info-name">You</div>
          </div>
          <div class="msg-text">
            ${dataChannelSend.value}
          </div>
        </div>
      </div>`
        texts.innerHTML += p;
        dataChannelSend.value = ""
    }
}

socket.on('created',room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then( stream =>{
                localStream = stream
                localVideo.srcObject = stream
                isCaller = true
            })
            .catch(err =>{
                console.log(err)
            })
})

socket.on('joined',room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then( stream =>{
                localStream = stream
                localVideo.srcObject = stream
                socket.emit('ready',roomNumber)
            })
            .catch(err =>{
                console.log(err)
            })
})

socket.on('ready',() => {
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)

        // for sending message
        dataChannel = rtcPeerConnection.createDataChannel(roomNumber)
        dataChannel.onmessage = event => { 

             p = `<div class="msg left-msg">
                <div class="msg-bubble">
                  <div class="msg-info">
                    <div class="msg-info-name">Your Friend</div>
                  </div>
                  <div class="msg-text">
                    ${event.data}
                  </div>
                </div>
              </div>`
              texts.innerHTML += p;
        }

        rtcPeerConnection.createOffer()
        .then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('offer',{
                type:'offer',
                sdp:sessionDescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log('there is an error',err)
        })

        
    }
})

socket.on('offer',(event) => {
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer()
        .then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('answer',{
                type:'answer',
                sdp:sessionDescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log('there is an error',err)
        })

        rtcPeerConnection.ondatachannel = event => {
            dataChannel = event.channel
            dataChannel.onmessage = event => { 

                p = `<div class="msg left-msg">
                <div class="msg-bubble">
                  <div class="msg-info">
                    <div class="msg-info-name">Your Friend</div>
                  </div>
                  <div class="msg-text">
                    ${event.data}
                  </div>
                </div>
              </div>`

              texts.innerHTML += p;
            }
        }
    }
})

socket.on('answer', event => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate',event=>{
    const candidate = new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)
}) 

socket.on('user-left',() => {
    console.log("some action needs to be taken.")
    document.getElementById('remoteVideo').style = 'display:none'
})


function onAddStream(event){
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0]
}

function onIceCandidate(event){
    if(event.candidate){
        console.log('sending icecandidate', event.candidate)
        socket.emit('candidate',{
            type:'candidate',
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room:roomNumber
        })
    }
    
}

let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)