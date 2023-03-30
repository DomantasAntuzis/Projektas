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

  // Find the first available game room
  for (const [key, value] of games.entries()) {
    if (value.players.length < 2) {
      gameId = key;
      game = value.game;
      players = value.players;
      time = value.time;
      break;
    }
  }

  // If no available game rooms, create a new one
  if (!game) {
    gameId = Math.random().toString(36).substr(2, 5);
    game = new Chess();
    games.set(gameId, {
      game,
      players: [],
      time: [300, 300, 0, "w"],
      turn: "w",
    });
    players = games.get(gameId).players;
    time = games.get(gameId).time;
  }

  socket.join(gameId);
  socket.emit("gameId", gameId);
  socket.emit("fen", game.fen());

  // socket.on("disconnect", function () {
  //   console.log(`Player ${socket.id} disconnected from game ${gameId}`);

  //   const index = players.indexOf(socket.id);
  //   if (index !== -1) {
  //     players.splice(index, 1);
  //   }

  //   // If one player left, end the game and delete the game room
  //   if (players.length === 1) {
  //     io.to(gameId).emit("endGame", {
  //       result: "abandoned",
  //       winner: turn === "w" ? "b" : "w",
  //     });
  //     games.delete(gameId);
  //   }
  // });

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
        time[3] = "b";
      } else {
        time[1] -= Math.floor((Date.now() - time[2]) / 1000);
        time[3] = "w";
      }
      time[2] = Date.now();

      io.to(gameId).emit("time", { w: time[0], b: time[1] });
    }
  });

  socket.on("updateTime", function (data) {
    console.log("updateTime");
    // console.log(game);
    if (time[3] == "w") {
      io.to(gameId).emit("time", {
        w: time[0] - Math.floor((Date.now() - time[2]) / 1000),
        b: time[1],
        turn: time[3],
      });
    } else {
      io.to(gameId).emit("time", {
        w: time[0],
        b: time[1] - Math.floor((Date.now() - time[2]) / 1000),
        turn: time[3],
      });
    }
  });

  socket.on("timeout", function (data) {
    console.log(data);
    socket.emit("timeout", data.winner);
  });
});

app.get("/", (req, res) => {
  res.send("titulinis");
});

app.get("/test", (req, res) => {
  res.send("test");
});
app.get("/test2", (req, res) => {
  res.send("test2");
});
app.get("/test3", (req, res) => {
  res.send("test3");
});

http.listen(3001, function () {
  console.log("Server listening on port 3001");
});
