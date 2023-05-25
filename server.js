const cluster = require("cluster");
var express = require("express");
var app = express();
var http = require("http");
const { Server } = require("socket.io");


var USERCOUNT = 3;

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("message", (room, data) => {
    console.log("message, room: " + room + ", data, type:" + data.type);
    socket.to(room).emit("message", room, data);
  });

  socket.on("join", (room) => {
    socket.join(room);

    var myRoom = io.sockets.adapter.rooms.get(room);
    var users = myRoom ? myRoom.size : 0;
    console.log("the user number of room (" + room + ") is: " + users);
    if (users < USERCOUNT) {
      console.log(users);
      socket.emit("joined", room, socket.id, users); //发给除自己之外的房间内的所有人
      if (users > 1) {
        socket.to(room).emit("otherjoin", room, socket.id);
      }
    } else {
      socket.leave(room);
      socket.emit("full", room, socket.id);
    }
  });
  socket.on("leave", (room) => {
    socket.leave(room);

    var myRoom = io.sockets.adapter.rooms[room];
    var users = myRoom ? Object.keys(myRoom.sockets).length : 0;
    console.log("the user number of room is: " + users);

    socket.to(room).emit("bye", room, socket.id);
    socket.emit("leaved", room, socket.id);
  });
});

httpServer.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
