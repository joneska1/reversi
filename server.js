var static = require('node-static');
var http = require('http');

var port = process.env.PORT;
var directory = __dirname + '/public';

if(typeof port == 'undefined' || !port){
	directory = './public';
	port = 8080;
}

var file = new static.Server(directory);

var app = http.createServer(
	function(request,response){
		request.addListener('end',
			function(){
				file.serve(request,response);
			}
		).resume();
	}
   ).listen(port);
console.log('The Server is running! Woohoo!');

/**************set up the web server sockets**************/

/* a registry of socket_ids and player info */
var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){
	
	log('Client connection by '+socket.id);

	function log(){
		var array = ['*** Server Log Message: '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log',array);
		socket.broadcast.emit('log',array);
	}



/* join_room command */
/* payload:
    {
		'room': room to join,
		'username': username of person joining,
  	}
	join_room_response: 
	{
		'result': 'success',
		'room': room joined,
		'username': username that joined,
		'socket_id': the socket id of the person that joined,
		'membership': number of people in the room including the new one
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}
*/

socket.on('join_room',function(payload){

		log('\'join_room\' command'+JSON.stringify(payload));

		/* Check that the client sent a payload */
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 

		/* Check that the payload has a room to join */
		var room = payload.room;
		if(('undefined' === typeof room) || !room){
			var error_message = 'join_room did not specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		/* Check that a username has been provided. */
		var username = payload.username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'join_room did not specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		


		/* Store info about this new player */
		players[socket.id] = {};
		players[socket.id].username = username;
		players[socket.id].room = room;

		/* Have the user join the room */
		socket.join(room);

		/* Get room object  */
		var roomObject = io.sockets.adapter.rooms[room];

		/* Tell everyone arleady in the room that someone just joined. */
		var numClients = roomObject.length;
		var success_data = {
								result: 'success',
								room: room,
								username: username,
								socket_id: socket.id,
								membership: numClients
							};
		io.in(room).emit('join_room_response',success_data);

		for(var socket_in_room in roomObject.sockets) {
			var success_data = {
								result: 'success',
								room: room,
								username: players[socket_in_room].username,
								socket_id: socket_in_room,
								membership: numClients
					   		};
			socket.emit('join_room_response',success_data);
		}
		log('join_room success');

		});

socket.on('disconnect',function(){
		log('Client disconnected '+JSON.stringify(players[socket.id]));

		if('undefined' !== typeof players[socket.id] && players[socket.id]){
			var username = players[socket.id].username;
			var room = players[socket.id].room;
			var payload = {
							username: username,
							socket_id: socket.id
			};
			delete players[socket.id];
			io.in(room).emit('player_disconnected',payload);
		}

});

/* send_message command */
/* payload:
    {
		'room': room to join,
		'username': username of person sending the message,
		'message': the message itself
  	}
	send_message_response: 
	{
		'result': 'success',
		'username': username of the person who spoke,
		'message': message spoken
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}
*/		

socket.on('send_message',function(payload){
		log('Server received a command','send_message',payload);
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'send_message had no payload, command aborted';
			log(error_message);
			socket.emit('send_message_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 

		var room = payload.room;
		if(('undefined' === typeof room) || !room){
			var error_message = 'send_message did not specify a room, command aborted';
			log(error_message);
			socket.emit('send_message_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'send_message did not specify a username, command aborted';
			log(error_message);
			socket.emit('send_message_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var message = payload.message;
		if(('undefined' === typeof message) || !message){
			var error_message = 'send_message did not specify a message, command aborted';
			log(error_message);
			socket.emit('send_message_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var success_data = {
								result: 'success',
								room: room,
								username: username,
								message: message

							};

		io.in(room).emit('send_message_response',success_data);
		log('Message sent to room '+ room + ' by ' + username);

});

/* invite command */
/* payload:
    {
		'requested_user': the socket id of the person to be invited,
  	}
	invite_response: 
	{
		'result': 'success',
		'socket_id': socket id of the person being invited
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}
	invited: 
	{
		'result': 'success',
		'socket_id': socket id of the person being invited
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}

*/		

socket.on('invite',function(payload){
		log('Invite with '+JSON.stringify(payload));

		/* Check to make sure a payload was sent */
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'invited had no payload, command aborted';
			log(error_message);
			socket.emit('invite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 

		/* Check that the message can be traced to a username. */
		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'invite can not identify who sent the message';
			log(error_message);
			socket.emit('invite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user){
			var error_message = 'invite did not specify a message, command aborted';
			log(error_message);
			socket.emit('invite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		/* Make sure the user being invited is inthe room. */
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'invite requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('invite_response',  {
													result: 'fail',
													message: error_message
												});
		}

		/* If everything is okay, respond to the inviter that it was successful. */

		var success_data = {
								result: 'success',
								socket_id: requested_user

							};

		socket.emit('invite_response', success_data);

		/*tell the invitee that they have been invited. */

		var success_data = {
								result: 'success',
								socket_id: socket.id

							};

		socket.to(requested_user).emit('invited', success_data);

		log('invite successful');

});

/* uninvite command */
/* payload:
    {
		'requested_user': the socket id of the person to be uninvited,
  	}
	uninvite_response: 
	{
		'result': 'success',
		'socket_id': socket id of the person being uninvited
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}
	uninvited: 
	{
		'result': 'success',
		'socket_id': socket id of the person doing the uninviting
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}

*/		

socket.on('uninvite',function(payload){
		log('uninvite with '+JSON.stringify(payload));

		/* Check to make sure a payload was sent */
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'uninvited had no payload, command aborted';
			log(error_message);
			socket.emit('uninvite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 

		/* Check that the message can be traced to a username. */
		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'uninvite can not identify who sent the message';
			log(error_message);
			socket.emit('uninvite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user){
			var error_message = 'uninvite did not specify a message, command aborted';
			log(error_message);
			socket.emit('uninvite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		/* Make sure the user being invited is inthe room. */
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'invite requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('invite_response',  {
													result: 'fail',
													message: error_message
												});
		}

		/* If everything is okay, respond to the inviter that it was successful. */

		var success_data = {
								result: 'success',
								socket_id: requested_user

							};

		socket.emit('uninvite_response', success_data);

		/*tell the uninvitee that they have been uninvited. */

		var success_data = {
								result: 'success',
								socket_id: socket.id

							};

		socket.to(requested_user).emit('uninvited', success_data);

		log('uninvite successful');

});

/* game_start command */
/* payload:
    {
		'requested_user': the socket id of the person to play with,
  	}
	game_start_response: 
	{
		'result': 'success',
		'socket_id': socket id of the person you are playing with
		'game_id' : id of the game session
	}
	or 
	{
		'result': 'fail',
		'message': failure message
	}
	
*/		

socket.on('game_start',function(payload){
		log('game_start with '+JSON.stringify(payload));

		/* Check to make sure a payload was sent */
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'game_start had no payload, command aborted';
			log(error_message);
			socket.emit('game_start_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 

		/* Check that the message can be traced to a username. */
		var username = players[socket.id].username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'game_start can not identify who sent the message';
			log(error_message);
			socket.emit('game_start_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var requested_user = payload.requested_user;
		if(('undefined' === typeof requested_user) || !requested_user){
			var error_message = 'uninvite did not specify a message, command aborted';
			log(error_message);
			socket.emit('uninvite_response',  {
													result: 'fail',
													message: error_message
												});
			return;
		} 		

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		/* Make sure the user being invited is inthe room. */
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'gamestart requested a user that was not in the room, command aborted';
			log(error_message);
			socket.emit('game_start_response',  {
													result: 'fail',
													message: error_message
												});
		}

		/* If everything is okay, respond to the game starter that it was successful. */

		var game_id = Math.floor((1+Math.random()) *0x10000).toString(16).substring(1);
		var success_data = {
								result: 'success',
								socket_id: requested_user,
								game_id: game_id

							};

		socket.emit('game_start_response', success_data);

		/*tell the other player to play. */

		var success_data = {
								result: 'success',
								socket_id: socket.id,
								game_id: game_id

							};

		socket.to(requested_user).emit('game_start_response', success_data);

		log('game_start successful');

});

});