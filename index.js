"use strict";

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.get('/', (req, res) =>  {
  res.sendFile(__dirname + '/');
});

// usernames which are currently connected to the chat
var usernames = {};

function check_key(v)
{
	var val = '';
	
	for(var key in usernames)
    {
		if(usernames[key] == v)
		val = key;
	}
	return val;
}

io.on('connection', function (socket) {

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.emit('updatechat', socket.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = socket.id;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', socket.username + ' you have joined the chat');
		// echo to client their username
		socket.emit('store_username', username);
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has left chat');
	});
	
	// when the user sends a private msg to a user id, first find the username
	socket.on('check_user', function(asker, id){
		io.to(usernames[asker]).emit('msg_user_found', check_key(id));
	});
	
	// when the user sends a private message to a user.. perform this
	socket.on('msg_user', function(to_user, from_user, msg) {
		//emits 'msg_user_handle', this updates the chat body on client-side
		io.to(usernames[to_user]).emit('msg_user_handle', from_user, msg);
		//write the chat message to a txt file		
		var wstream = fs.createWriteStream('chat_data.txt');		
		wstream.write(msg);
		wstream.write('\r\n');
		wstream.end();
		
	});


});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
    