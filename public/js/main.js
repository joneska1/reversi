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

	var newHTML = '<p>' +payload.username+' just entered the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
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

	var newHTML = '<p>' +payload.username+' has left the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
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
	$('#send_message_holder').val('');
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
		$('#messages').prepend(newNode);
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

	$('#quit').append('<a href="lobby.html?username='+username+'" class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');	


});

var old_board = [
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?']
				];

var my_color = ' ';

socket.on('game_update',function(payload){

	console.log('*** Client Log Message: \'game_update\'\n\tpayload: '+JSON.stringify(payload));
	/* check for a good board update */
	if(payload.result == 'fail'){
			console.log(payload.message);
			window.location.href = 'lobby.html?username='+username;
			return;
	}

	/* check for a good board in the payload */
	var board = payload.game.board;
	if('undefined' == typeof board || !board){
		console.log('Internal error: received a malformed board update from the server');
	}

/* update my color*/
if(socket.id == payload.game.player_white.socket){
	my_color = 'white';
}
else if(socket.id == payload.game.player_black.socket){
	my_color = 'black';
}
else{
	/*something weird is going on. send client back to lobby.*/
	window.location.href = 'lobby.html?username='+username;
	return;
}

$('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');

/* animate changes to the board */

var blacksum = 0;
var whitesum = 0;
var row,column;
for(row = 0; row < 8; row++){
	for(column = 0; column < 8; column++){
		if(board[row][column] == 'b'){
			blacksum++;
		}
		if(board[row][column] == 'w'){
			whitesum++;
		}

		/* if a board space has changed */
		if(old_board[row][column] != board [row][column]){
			if(old_board[row][column] == '?' && board[row][column] == ' '){
				$('#'+row+'_'+column).html('<img src="Assets/Images/empty.gif" alt="empty square"/>');
			}

		else if(old_board[row][column] == '?' && board[row][column] == 'w'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/empty_to_white.gif" alt="white square"/>');
			}

		else if(old_board[row][column] == '?' && board[row][column] == 'b'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/empty_to_black.gif" alt="black square"/>');
			}
		else if(old_board[row][column] == ' ' && board[row][column] == 'w'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/empty_to_white.gif" alt="white square"/>');
			}

		else if(old_board[row][column] == ' ' && board[row][column] == 'b'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/empty_to_black.gif" alt="black square"/>');
			}

		else if(old_board[row][column] == 'w' && board[row][column] == ' '){
				$('#'+row+'_'+column).html('<img src="Assets/Images/white_to_empty.gif" alt="empty square"/>');
			}

		else if(old_board[row][column] == 'b' && board[row][column] == ' '){
				$('#'+row+'_'+column).html('<img src="Assets/Images/black_to_empty.gif" alt="empty square"/>');
			}

		else if(old_board[row][column] == 'w' && board[row][column] == 'b'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/white_to_black.gif" alt="black square"/>');
			}

		else if(old_board[row][column] == 'b' && board[row][column] == 'w'){
				$('#'+row+'_'+column).html('<img src="Assets/Images/black_to_white.gif" alt="white square"/>');
				}
		else{
				$('#'+row+'_'+column).html('<img src="Assets/Images/error.gif" alt="error"/>');
			}

		/* set up interactivity */

		$('#'+row+'_'+column).off('click');
		if(board[row][column] == ' '){
			$('#'+row+'_'+column).addClass('hovered_over');
			$('#'+row+'_'+column).click(function(r,c){
				return function(){
					var payload = {};
					payload.row = r;
					payload.column = c;
					payload.color = my_color;
					console.log(' *** Client Log Message: \'play_token\' payload: '+JSON.stringify(payload));
					socket.emit('play_token',payload);
				};
			}(row,column));	
		}
		else{
			$('#'+row+'_'+column).removeClass('hovered_over');	
		}

		}
		}
	}

	$('#blacksum').html(blacksum);
	$('#whitesum').html(whitesum);

	old_board = board;
});

socket.on('play_token_response',function(payload){

	console.log('*** Client Log Message: \'play_token_response\'\n\tpayload: '+JSON.stringify(payload));
	/* check for a good play_token_response */
	if(payload.result == 'fail'){
			console.log(payload.message);
			alert(payload.message);
			return;
	}
});

socket.on('game_over',function(payload){

	console.log('*** Client Log Message: \'game_over\'\n\tpayload: '+JSON.stringify(payload));
	/* check for a good play_token_response */
	if(payload.result == 'fail'){
			console.log(payload.message);
			alert(payload.message);
			return;
	}

	/*jump to a new page*/

	$('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+' won!</h2>');
	$('#game_over').append('<a href="lobby.html?username='+username+'" class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the lobby</a>');
});


