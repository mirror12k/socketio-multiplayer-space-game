
var socketio = require('socket.io');




function startServer(httpServer) {
	var server = socketio.listen(httpServer);
	server.sockets.on('connection', onSocketIOConnection);

	var gameState = {};

	function onSocketIOConnection(socket) {
		console.log('got client connection');
		socket.gameClient = {
			authenticated: false,
		};
		socket.on('authenticate', function (data) {
			console.log('got authentication from client as ' + data.username);
			socket.gameClient.username = data.username;
			socket.gameClient.authenticated = true;
			socket.emit('authenticated');
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
