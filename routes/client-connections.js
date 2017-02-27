
var socketio = require('socket.io');




function startServer(httpServer) {
	var server = socketio.listen(httpServer);
	server.sockets.on('connection', onSocketIOConnection);

	var gameState = {
		players: {},
		asteroids: {
			1: { id: 1, x: 100, y: 100, size: 10 },
			2: { id: 2, x: 200, y: 150, size: 15 },
			3: { id: 3, x: 100, y: 300, size: 30 },
		},
	};

	function compileClientState(clientId, client) {
		var nearPlayers = [];
		for (var id in gameState.players) {
			if (id !== clientId)
				nearPlayers.push(gameState.players[id]);
		}
		return { me: client, players: nearPlayers, asteroids: gameState.asteroids };
	}

	function onSocketIOConnection(socket) {
		console.log('got client connection');
		socket.gameClient = {
			authenticated: false,
		};
		socket.on('authenticate', function (data) {
			console.log('got authentication from client ' + data.username);
			socket.gameClient.username = data.username;
			socket.gameClient.authenticated = true;

			gameState.players[socket.id] = { x: 5.0, y: 5.0 };
			socket.emit('authenticated', compileClientState(socket.id, gameState.players[socket.id]));
		});
		socket.on('state_update', function (clientState) {
			if (socket.gameClient.authenticated) {
				// console.log('got state update from client');
				gameState.players[socket.id] = clientState;
				if (clientState.action === 'mining') {
					var asteroid = gameState.asteroids[clientState.targetID];
					if (asteroid) {
						asteroid.size -= 0.25;
						if (asteroid.size < 3) {
							delete gameState.asteroids[clientState.targetID];
						}
					}
				}
				socket.emit('state_update', compileClientState(socket.id, gameState.players[socket.id]));
			} else {
				console.log('bad client');
				socket.disconnect();
			}
		});
	}
}

module.exports = startServer;
