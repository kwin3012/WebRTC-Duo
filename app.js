const express = require('express')
const app = express()
let http = require('http').Server(app)
const port = process.env.PORT || 3000

let io = require('socket.io')(http)

app.use(express.static('public'))

http.listen(port,()=>{
    console.log('listening on '+ port);
})

io.on('connection',socket => {
    console.log('A user connected')


    socket.on('join',room => {
        console.log('create or join to', room)
        
        const myRoom = io.of("/").adapter.rooms.get(room);
        const numClients = (myRoom === undefined) ? 0 : myRoom.size
        
        console.log(myRoom)
        console.log(room,'has',numClients,'clients')
    
        if(numClients == 0){
            socket.join(room)
            socket.emit('created',room)

            const myRoom = io.sockets.adapter.rooms[room] 

            console.log(myRoom)
        } else if (numClients==1){
            socket.join(room)
            socket.emit('joined',room)
        } else {
            socket.emit('full',room)
        }
    })

    socket.on('ready',room =>{
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate',event =>{
        socket.broadcast.to(event.room).emit('candidate',event)
    })

    socket.on('offer',event =>{
        socket.broadcast.to(event.room).emit('offer',event.sdp)
    })

    socket.on('answer',event =>{
        socket.broadcast.to(event.room).emit('answer',event.sdp)
    })

    socket.on('disconnect',() =>{
        console.log("disconnection")
        socket.to(room).broadcast.emit('user-left')
    })

})








