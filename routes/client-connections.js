
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
			socket.emit('authenticated', { me: gameState.players[socket.id], asteroids: gameState.asteroids });
		});
		socket.on('state_update', function (client_state) {
			if (socket.gameClient.authenticated) {
				console.log('got state update from client');
				
			} else {
				console.log('bad client');
				socket.close();
			}
		});
	}
}

module.exports = startServer;
