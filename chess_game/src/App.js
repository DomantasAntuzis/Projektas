import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Chess } from "chess.js";

function App() {
  const [position, setPosition] = useState("start");
  const [game, setGame] = useState(new Chess());
  const [socket, setSocket] = useState(null);
  const [turn, setTurn] = useState("w"); // "w" for white, "b" for black
  const [playerColor, setPlayerColor] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3001", {
      query: {
        gameId: "my-game-id",
      },
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("color", (color) => {
      console.log(`Received color from server: ${color}`);
      setPlayerColor(color);
    });
    
    socket.on("fen", (fen) => {
      console.log(`Received fen from server: ${fen}`);
      setGame(new Chess(fen));
      setPosition(fen);
    });
    
    socket.on("turn", (turn) => {
      console.log(`Received turn from server: ${turn}`);
      setTurn(turn);
    });
    
    // Add this console log to check if the client is receiving the color
    console.log("Waiting for color from server...");
  }, [socket]);

  function handleMove(from, to) {
    if (game.turn() === playerColor) {
    const move = game.move({ from, to, promotion: "q" });
    if (move !== null) {
      if (move.flags.includes("p")) {
        const promotedTo = prompt("Choose promotion piece: q, r, b, or n");
        if (
          promotedTo &&
          ["q", "r", "b", "n"].includes(promotedTo.toLowerCase())
        ) {
          game.put({ type: promotedTo.toLowerCase(), color: move.color }, to);
        } else {
          game.put({ type: "q", color: move.color }, to);
        }
      }
      socket.emit("move", {
        from: from,
        to: to,
      });
      setPosition(game.fen());
      setTurn(game.turn());
    }}
  }

function handleReset() {
  const newGame = new Chess();
  const color = Math.random() < 0.5 ? "w" : "b";
  setGame(newGame);
  setPosition(newGame.fen());
  setPlayerColor(color);
  socket.emit("color", color); // <-- emit "color" event to the client
}


  return (
    <div
      style={{
        margin: "3rem auto",
        maxWidth: "70vh",
        width: "70vw",
      }}
    >
      <p>Playing as {playerColor ? (playerColor === "w" ? "white" : "black") : "unknown"}</p>
      <Chessboard
        id="Configurable Board"
        position={position}
        onPieceDrop={(from, to) => {
          if (game.turn() === turn && playerColor === game.turn()) {
            handleMove(from, to);
          }
        }}
      />
      <button
        onClick={handleReset}
      >
        Reset Board
      </button>
    </div>
  );
}

export default App;
