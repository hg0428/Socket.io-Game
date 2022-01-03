const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const path = require("path");
const app = express();
const httpserver = http.Server(app);
const io = socketio(httpserver);
const directory = path.join(__dirname, "client");
app.use(express.static(directory));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
httpserver.listen(3000);
var users={};
var sockets = {};
class User {
	constructor(socket, width, height) {
		this.id=socket.id;
		this.width=width;
		this.height=height;
		this.x=0;
		this.y=0;
		this.velocity = {
			x:0,
			y:0,
			rotation:0
		}
	}
}
io.on('connection', (socket) => {
	console.log(`User ${socket.id} just connected.`);
	//console.log(Object.keys(users));
	socket.emit("entered", users, socket.id, true);
	socket.on("readyState", function(width, height) {
		console.log(`User ${socket.id} is ready!`);
		u = new User(socket, width, height);
		users[socket.id]=u;
		sockets[socket.id]=socket;
		io.emit("newuser", u);
	});
  socket.on('disconnect', () => {
		io.emit("leave", socket.id);
		delete users[socket.id];
    console.log(`User ${socket.id} has disconnected.`);
  });
	socket.on("update", function(id, loc, vel) {
		if (vel===null || vel===undefined || id==0) {
			console.log("broke🙁", id, loc, vel);
		}
			if (users[id]==undefined) {
				console.log(`🙁 ${id} broke: ${users[id]}\nThey did not intitiate the socket correctly.`);
				socket.emit("fail");
				return;
			} else {
			users[id].x=loc[0];
			users[id].y=loc[1];
			io.emit("update", id, loc, vel);
			}
	});
	socket.on("resize", function(id, width, height){
		users[id].width=width;
		users[id].height=height;
		io.emit("resize", id, width, height);
	});
});

setInterval(function() {
	for (u in users) {
		u=users[u]
		s=sockets[u.id];
		s.emit("entered", users, u.id, false);
	}
}, 2000);