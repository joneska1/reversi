function getURLParameters(whichParam) {
	var pageURL = window.location.search.substring(1);
	var pageURLVariables = pageURL.split('&');
	for (var i = 0; i < pageURLVariables.length; i++){
		var parameterName = pageURLVariables[i].split('=');
		if(parameterName[0] == whichParam){
			return parameterName[1];
		}
	}

}

var username = getURLParameters('username');
if( 'undefined' == typeof username || !username){
	username = 'Anonymous_'+Math.random(); 
}

var chat_room = getURLParameters('game_id');
if('undefined' == typeof chat_room || !chat_room){
	chat_room = 'lobby';
}


var socket = io.connect();

socket.on('log',function(array){
	console.log.apply(console,array);
});

socket.on('join_room_response',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	if(payload.socket_id == socket.id) {
		return;
	}

	var dom_elements = $('.socket_'+payload.socket_id);

	if(dom_elements.length ==0){
		var nodeA = $('<div></div>');
		nodeA.addClass('socket_'+payload.socket_id);

		var nodeB = $('<div></div>');
		nodeB.addClass('socket_'+payload.socket_id);
		
		var nodeC = $('<div></div>');
		nodeC.addClass('socket_'+payload.socket_id);

		nodeA.addClass('w=100');

		nodeB.addClass('col-9 text-right');
		nodeB.append('<h4>'+payload.username+'</h4>');

		nodeC.addClass('col-3 text-left');
		var buttonC = makeInviteButton(payload.socket_id);
		nodeC.append(buttonC);

		nodeA.hide();
		nodeB.hide();
		nodeC.hide();
		$('#players').append(nodeA,nodeB,nodeC);
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);
	}

	else{
		univite(payload.socket_id);
		var buttonC = makeInviteButton(payload.socket_id);
		$('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}

	var newHTML = '<p>' +payload.username+' just entered the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

/* What to when the server says that someone has left */
socket.on('player_disconnected',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	if(payload.socket_id == socket.id) {
		return;
	}

	var dom_elements = $('.socket_'+payload.socket_id);

	if(dom_elements.length != 0){
		dom_elements.slideUp(1000);
	}

	var newHTML = '<p>' +payload.username+' has left the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

/* Send an invite message to the server */
function invite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'invite\' payload: '+JSON.stringify(payload));
	socket.emit('invite',payload);
}

socket.on('invite_response',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInvitedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makePlayButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Send an uninvite message to the server */
function uninvite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'uninvite\' payload: '+JSON.stringify(payload));
	socket.emit('uninvite',payload);
}

socket.on('uninvite_response',function(payload){
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('uninvited',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

/* Send a game start message to the server */
function game_start(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'game start\' payload: '+JSON.stringify(payload));
	socket.emit('game_start',payload);
}

/* Handle notification that we have been engaged */
socket.on('game_start_response',function(payload){
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}


	var newNode = makeEngagedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

	/*Jump to a new page */
	window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

function send_message(){
	var payload = {};	
	payload.room = chat_room;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message',payload);
}

socket.on('send_message_response',function(payload){
	console.log('here');
	if (payload.result == 'fail'){
		alert(payload.message);
		return;
	}

		var newHTML = '<p><b>'+payload.username+' says:</b> '+payload.message+'</p>';
		var newNode = $(newHTML);
		newNode.hide();
		$('#messages').append(newNode);
		newNode.slideDown(1000);
});


function makeInviteButton(socket_id) {

	var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		invite(socket_id);
	});
	return(newNode);
}

function makeInvitedButton(socket_id) {

	var newHTML = '<button type=\'button\' class=\'btn btn-primary\'>Invited</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		uninvite(socket_id);
	});
	return(newNode);
}

function makePlayButton(socket_id) {

	var newHTML = '<button type=\'button\' class=\'btn btn-success\'>Play</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		game_start(socket_id);
	});
	return(newNode);
}

function makeEngagedButton() {

	var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
	var newNode = $(newHTML);
	return(newNode);
}

$(function(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;

	console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room', payload);
});