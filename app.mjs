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
  const gameId = socket.handshake.query.gameId;
  console.log(`Client connected to game ${gameId}`);

  if (!games.has(gameId)) {
    games.set(gameId, new Chess());
  }

  const game = games.get(gameId);

  socket.emit("fen", game.fen());

  socket.on("move", function (data) {
    console.log(`Move received from client: ${JSON.stringify(data)}`);

    const move = game.move(data);

    if (move) {
      io.emit("fen", game.fen());
    }
  });
});

http.listen(3001, function () {
  console.log("Server listening on port 3001");
});

