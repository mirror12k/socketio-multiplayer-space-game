
var socketio = require('socket.io');




function startServer(httpServer) {
	var server = socketio.listen(httpServer);
	server.sockets.on('connection', onSocketIOConnection);

	var gameState = {
		players: {},
		asteroids: {
			1: { x: 100, y: 100 },
			2: { x: 200, y: 150 },
			3: { x: 100, y: 300 },
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
			console.log('got authentication from client as ' + data.username);
			socket.gameClient.username = data.username;
			socket.gameClient.authenticated = true;

			gameState.players[socket.id] = { x: 5.0, y: 5.0 };
			socket.emit('authenticated', compileClientState(socket.id, gameState.players[socket.id]));
		});
		socket.on('state_update', function (client_state) {
			if (socket.gameClient.authenticated) {
				console.log('got state update from client');
				gameState.players[socket.id] = client_state;
				socket.emit('state_update', compileClientState(socket.id, gameState.players[socket.id]));
			} else {
				console.log('bad client');
				socket.disconnect();
			}
		});
	}
}

module.exports = startServer;
