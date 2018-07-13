"use strict";

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use('/public', express.static('public'))

app.get('/', (req, res) =>  {
  res.sendFile(__dirname + '/'); 
});


// usernames which are currently connected to the chat
let usernames = {};

const check_key = v =>{
	let val = '';	
	for(let key in usernames){
		if(usernames[key] == v)	val = key;
	}
	return val;
}

io.on('connection',  socket => {
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', data => io.emit('updatechat', socket.username, data));

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', username => {
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = socket.id;
		// echo to client they've connected
		//socket.emit('updatechat', 'Chat Bot', socket.username + ' you have joined the chat');
		socket.emit('updatechat', 'Chat Bot', `${socket.username} you have joined the chat`);
		// echo to client their username
		socket.emit('store_username', username);
		// echo globally (all clients) that a person has connected
		//socket.broadcast.emit('updatechat', 'Chat Bot', `${username} has connected`);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', () => {
		// remove the username from global usernames list
		delete usernames[socket.username];
		// echo globally that this client has left
		//socket.broadcast.emit('updatechat', 'Chat Bot', `${socket.username} has left chat`);
	});
	
	// when the user sends a private msg to a user id, first find the username
	socket.on('check_user', (asker, id) => io.to(usernames[asker]).emit('msg_user_found', check_key(id)));
	
	// when the user sends a private message to a user.. perform this
	socket.on('msg_user', (to_user, from_user, msg) => {
		//emits 'msg_user_handle', this updates the chat body on client-side
		io.to(usernames[to_user]).emit('msg_user_handle', from_user, msg);
		//write the chat message to a txt file		
		const wstream = fs.createWriteStream('chat_data.txt');		
		wstream.write(msg);
		wstream.write('\r\n');
		wstream.end();
		
	});


});

http.listen(3000, () => console.log('listening on *:3000'));
    