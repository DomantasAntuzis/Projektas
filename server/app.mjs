import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Chess } from "chess.js";

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.static("public"));

const games = new Map();

io.on("connection", function (socket) {
  let gameId = socket.handshake.query.gameId;
  console.log(`Client connected to game ${gameId}`);

  let game = null;
  let players = null;
  let time = null;
  let turn = null;

  // Find the first available game room
  for (const [key, value] of games.entries()) {
    if (value.players.length < 2) {
      gameId = key;
      game = value.game;
      players = value.players;
      time = value.time;
      turn = value.turn;
      break;
    }
  }

  // If no available game rooms, create a new one
  if (!game) {
    gameId = Math.random().toString(36).substr(2, 5);
    game = new Chess();
    games.set(gameId, { game, players: [], time: [300, 300, 0], turn: "w" });
    players = games.get(gameId).players;
    time = games.get(gameId).time;
    turn = games.get(gameId).turn;
  }

  socket.join(gameId);
  socket.emit("gameId", gameId);
  socket.emit("fen", game.fen());

  if (players.length === 0) {
    players.push(socket.id);
    socket.emit("color", "w");
  } else if (players.length === 1) {
    players.push(socket.id);
    socket.emit("color", "b");
    socket.emit("turn", "w");
    io.to(players[0]).emit("turn", "w");

    time[2] = Date.now();
    socket.emit("time", { w: time[0], b: time[1] });
    io.to(players[0]).emit("time", { w: time[0], b: time[1] });
  }

  socket.on("move", function (data) {
    console.log(`Move received from client: ${JSON.stringify(data)}`);

    const move = game.move(data);

    if (move) {
      io.to(gameId).emit("fen", game.fen());
      io.to(gameId).emit("turn", game.turn());

      if (move.color == "w") {
        time[0] -= Math.floor((Date.now() - time[2]) / 1000);
        turn = "b";
      } else {
        time[1] -= Math.floor((Date.now() - time[2]) / 1000);
        turn = "w";
      }
      time[2] = Date.now();

      io.to(gameId).emit("time", { w: time[0], b: time[1] });
    }
  });

  socket.on("updateTime", function (data) {
    console.log("updateTime");
    // console.log(game);
    if (turn == "w") {
      io.to(gameId).emit("time", {
        w: time[0] - Math.floor((Date.now() - time[2]) / 1000),
        b: time[1],
      });
    } else {
      io.to(gameId).emit("time", {
        w: time[0],
        b: time[1] - Math.floor((Date.now() - time[2]) / 1000),
      });
    }
  });

  socket.on("timeout", function (data) {
    console.log(data);
  });

  socket.on("timer", (timer) => {
    socket.broadcast.emit("timer", timer);
  });
});

http.listen(3001, function () {
  console.log("Server listening on port 3001");
});
