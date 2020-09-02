const http = require('http')
const path = require('path')

const express = require('express')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')

const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser , removeUser , getUser , getUsersInRoom} = require('./utils/users')

const PORT = process.env.PORT || 3000
const staticPathDirectory = path.join(__dirname,'../public')
app.use(express.static(staticPathDirectory))

const server = http.createServer(app)
const io = socketio(server)

io.on('connection',(socket)=>{

 socket.on('join',(options,callback)=>{

	const {error,user} = addUser({id:socket.id,...options})
	if(error)
		return callback(error)

	socket.join(user.room)
	socket.emit('message',generateMessage('Admin',`Welcome ${user.username}`))
	socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
	io.to(user.room).emit('roomData',{
		room:user.room,
		users:getUsersInRoom(user.room)
	})

	callback()
 })

 socket.on('sendMessage',(data,callback)=>{

	const user = getUser(socket.id)
	if(!user)
		return callback('user not found!')

	const filter = new Filter() 
	if(filter.isProfane(data)){
		return callback('profanity is not allowed!')
	}

	 io.to(user.room).emit('message',generateMessage(user.username,data))
	 callback()
 })

 socket.on('sendLocation',(coords,callback)=>{
	 const user = getUser(socket.id)
	 if(!user){
		return callback('user not found!')
	 }
	io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
	callback()
 })

 socket.on('disconnect',()=>{
	 const user = removeUser(socket.id)

	 if(user){
	 io.to(user.room).emit('message',generateMessage(user.username,`${user.username} has left!`))
	 io.to(user.room).emit('roomData',{
		 room:user.room,
		 users:getUsersInRoom(user.room)
	 })
	 }

 })

})


server.listen(PORT,()=>{
	console.log(`server is listening on port ${PORT}`)
})

