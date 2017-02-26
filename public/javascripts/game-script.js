
var socket;


var clientState = {};
var gameState;

var keyState = {
	W: false,
	A: false,
	S: false,
	D: false,
};

function drawGame() {
	var canvas = $('#gameCanvas')[0];
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, 640, 400);

	ctx.fillStyle = '#FF00FF';
	ctx.fillRect(gameState.me.x - 10, gameState.me.y - 10, 20, 20);

	for (var asteroid in gameState.asteroids) {
		asteroid = gameState.asteroids[asteroid];
		ctx.fillStyle = '#FFAA00';
		ctx.fillRect(asteroid.x - 10, asteroid.y - 10, 20, 20);
	}
	for (var i = 0; i < gameState.players.length; i++) {
		player = gameState.players[i];
		ctx.fillStyle = '#00AAFF';
		ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
	}
}

function calculateHeading() {
	var sx = 0, sy = 0;

	if (keyState.A) {
		sx = -4;
	} else if (keyState.D) {
		sx = 4;
	}

	if (keyState.W) {
		sy = -4;
	} else if (keyState.S) {
		sy = 4;
	}

	return { sx: sx, sy: sy };
}

function updateGame() {
	// console.log("debug keystate: ", keyState);
	drawGame();

	var heading = calculateHeading();
	gameState.me.x += heading.sx;
	gameState.me.y += heading.sy;

	for (var i = 0; i < gameState.players.length; i++) {
		player = gameState.players[i];
		player.x += player.sx;
		player.y += player.sy;
	}
}

function sendState() {
	var heading = calculateHeading();
	var state = { x: gameState.me.x, y: gameState.me.y, sx: heading.sx, sy: heading.sy, };
	socket.emit('state_update', state);
}

function onStateUpdate (state) {
	gameState = state;
}

function startClientGame(state) {
	gameState = state;

	setInterval(updateGame, 1000 / 60);
	setInterval(sendState, 100);

	$('#gameCanvas').keydown(function (e) {
		var key = String.fromCharCode(e.keyCode);
		keyState[key] = true;
	});
	$('#gameCanvas').keyup(function (e) {
		var key = String.fromCharCode(e.keyCode);
		keyState[key] = false;
	});
}

function startClientConnection(username) {
	clientState.username = username;

	socket = io.connect('/');
	socket.on('authenticated', startClientGame);
	socket.on('state_update', onStateUpdate);

	socket.emit('authenticate', clientState);
	$('#nameEntry').hide();
}

$(function () {

	$('#nameEntryButton').click(function (e) {
		e.preventDefault();
		var username = $('#username').val();
		startClientConnection(username);
	});

});