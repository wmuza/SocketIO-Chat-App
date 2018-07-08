"use strict";

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) =>  {
  res.sendFile(__dirname + '/');
});

// usernames which are currently connected to the chat
let usernames = {};

io.sockets.on('connection', socket => { 

	// when the client emits 'sendchat', this listens and executes
	// we tell the client to execute 'updatechat' with 2 parameters
	socket.on('sendchat', msg => io.sockets.emit('updatechat', socket.username, msg));
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', username => {
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has joined the chat
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has joined the chat');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});
	 
	// when the user disconnects.. perform this
	socket.on('disconnect',() => {
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has left chat');
	});
	
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
    