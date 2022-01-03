var ID, users={};
function update() {if (ID!==undefined) socket.emit("update", ID, [player.x, player.y], player.velocity)};
function onload() {
	socket=io();
	socket.on("resize", function(id, width, height){
		if (id!==ID) {
			users[id].GameWidth=width;
			users[id].GameHeight=height;
		}
	}); 
	socket.on("entered", function(e, thisID, ready) {
		game.OBJECTS=[player];
		users={};
		ID=thisID;
		for (var i in e) {
			user=e[i];
			if (user.id!=ID) {
				users[i] = new Item(game, 35, 35);
				users[i].GameWidth=user.width;
				users[i].GameHeight=user.height;
				users[i].setPos(user.x, user.y);
			}
		}
		game.start();
		users[ID] = player;
		if (ready) {
			socket.emit("readyState", game.width, game.height);
			KEYS.bindKey(function(e) {if(e){player.velocity.x-=0.01*e;update();}}, ["A",  "left"], true);
			KEYS.bindKey(function(e) {if(e){player.velocity.x+=0.01*e;update();}}, ["D", "right"], true);
			KEYS.bindKey(function(e) {if(e){player.velocity.y-=0.01*e;update();}}, ["W",    "up"], true);
			KEYS.bindKey(function(e) {if(e){player.velocity.y+=0.01*e;update();}}, ["S",  "down"], true);
			//The above code sets the keybinds. We multiply by e to keep a consistant movement speed.
			game.onresize = function() {
				player.GameWidth=game.width;
				player.GameHeight=game.height;
				socket.emit("resize", ID, game.width, game.height);
			};
		}
  });
	socket.on("update", function(id, loc, velocity) {
		if (id!==ID) {
			users[id].setPos(loc[0], loc[1]);
			users[id].velocity=velocity;
		}
	});
	socket.on("newuser", function(user) {
		if (user.id!==ID) {
			users[user.id]=new Item(game, 35, 35);
			users[user.id].GameWidth=user.width;
			users[user.id].GameHeight=user.height;
		}
		update();
	});
	socket.on("leave", function(id) {
		update();
		if (id!==ID) {
			game.OBJECTS = removeItem(game.OBJECTS, users[id]);
			delete users[id];
		}
	});
};
var game = new Game();
var player = new Item(game, 35, 35); // I had to change the name of Object, since I recently figured out that Object was already defined.
player.GameWidth=game.width;
player.GameHeight=game.height;
//player.GameWidth and player.GameHeight are not real properties of Item, I just made them up so I wouldn't have to store them.
player.colors.fill="green";
game.WindowGameLoop = function(e) {
	//e is time elapsed since last frame
	for (var i in users){
		var user=users[i];
		user.velocity.x-=0.01*e*user.velocity.x; 
		user.velocity.y-=0.01*e*user.velocity.y;
		//The above code applies some air resistance

		
		if (user.x+user.width>=user.GameWidth) user.setPos(user.GameWidth-user.width, user.y);
		if (user.x<=0) user.setPos(0, user.y);
		if (user.y+user.height>=user.GameHeight) user.setPos(user.x, user.GameHeight-user.height);
		if (user.y<=0) user.setPos(user.x, 0);
		//The above part keeps the player in screen bounds. This will be removed if I ever turn this into a real "Game"
	};
};
var fps = document.getElementById("fpscount");
setInterval(function() {
	if (FPS!==Infinity) fps.innerHTML = `FPS: ${FPS}<br/>Users:${Object.keys(users).length}`;
}, 120);