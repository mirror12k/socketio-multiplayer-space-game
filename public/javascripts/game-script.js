
var socket;


var clientState = {};
var gameState;

var keyState = {
	W: false,
	A: false,
	S: false,
	D: false,
};

var mouseState = {
	x: -1,
	y: -1,
};

function findNearAsteroid(x, y) {
	var near = undefined;
	for (var asteroidID in gameState.asteroids) {
		var asteroid = gameState.asteroids[asteroidID];
		var dist = Math.max(Math.abs(asteroid.x - x), Math.abs(asteroid.y - y));
		if (dist <= asteroid.size + 5)
			near = asteroid;
	}
	return near;
}

function drawGame() {
	var canvas = $('#gameCanvas')[0];
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, 640, 400);

	ctx.fillStyle = '#FF00FF';
	ctx.fillRect(gameState.me.x - 10, gameState.me.y - 10, 20, 20);

	for (var asteroidID in gameState.asteroids) {
		var asteroid = gameState.asteroids[asteroidID];
		ctx.fillStyle = '#FFAA00';
		ctx.fillRect(asteroid.x - asteroid.size, asteroid.y - asteroid.size, asteroid.size * 2, asteroid.size * 2);
	}

	var highlightAsteroid = findNearAsteroid(mouseState.x, mouseState.y);
	if (highlightAsteroid) {
		var asteroid = highlightAsteroid;
		ctx.strokeStyle = '#00AA44';
		ctx.lineWidth = 3;
		ctx.strokeRect(asteroid.x - asteroid.size - 5, asteroid.y - asteroid.size - 5, asteroid.size * 2 + 10, asteroid.size * 2 + 10);
	}

	for (var i = 0; i < gameState.players.length; i++) {
		var player = gameState.players[i];
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
		var player = gameState.players[i];
		if (player.frameUpdate >= 2) {
			console.log('moving player');
			player.x += player.sx;
			player.y += player.sy;
		} else {
			player.frameUpdate += 1;
		}
	}
}

function sendState() {
	var heading = calculateHeading();
	var state = { x: gameState.me.x, y: gameState.me.y, sx: heading.sx, sy: heading.sy, };
	socket.emit('state_update', state);
}

function onStateUpdate (new_state) {
	for (var i = 0; i < new_state.players.length; i++) {
		var player = new_state.players[i];
		if (gameState.players[i] && gameState.players[i].sx === player.sx && gameState.players[i].sy === player.sy) {
			console.log('keeping frameUpdate state for player', i);
			player.frameUpdate = gameState.players[i].frameUpdate;
		} else {
			player.frameUpdate = 0;
		}
	}
	gameState = new_state;
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
	$('#gameCanvas').mousemove(function(event) {
		mouseState.x = event.offsetX;
		mouseState.y = event.offsetY;
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