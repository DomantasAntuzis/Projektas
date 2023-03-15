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

  // Find the first available game room
  for (const [key, value] of games.entries()) {
    if (value.players.length < 2) {
      gameId = key;
      game = value.game;
      players = value.players;
      break;
    }
  }

  // If no available game rooms, create a new one
  if (!game) {
    gameId = Math.random().toString(36).substr(2, 5);
    game = new Chess();
    games.set(gameId, { game, players: [] });
    players = games.get(gameId).players;
  }

  socket.join(gameId);
  socket.emit("gameId", gameId);
  socket.emit("fen", game.fen());

  if (players.length === 0) {
    players.push(socket.id);
    socket.emit("color", "w");
  } else if (players.length === 1) {
    players.push(socket.id);
    const color = players[0] === socket.id ? "w" : "b";
    socket.emit("color", color);
    io.to(players[0]).emit("color", color === "w" ? "b" : "w");
  }
  
  socket.on("move", function (data) {
    console.log(`Move received from client: ${JSON.stringify(data)}`);

    const move = game.move(data);

    if (move) {
      io.to(gameId).emit("fen", game.fen());
      io.to(gameId).emit("turn", game.turn());
    }
  });
});

http.listen(3001, function () {
  console.log("Server listening on port 3001");
});
