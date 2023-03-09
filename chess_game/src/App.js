import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import io from "socket.io-client"
import { Chess } from "chess.js";

function App() {
  const [position, setPosition] = useState("start");
  const [game, setGame] = useState(new Chess());
  const [socket, setSocket] = useState(null)

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

    socket.on("fen", (fen) => {
      console.log(`Received fen from server: ${fen}`);
      setGame(new Chess(fen));
      setPosition(fen);
    });
  }, [socket]);

  function handleMove(from, to) {
    console.log(`Sending move to server: ${from}-${to}`);
    const move = game.move({ from, to, promotion: 'q' });
    if (move !== null) {
      if (move.flags.includes('p')) {
        const promotedTo = prompt("Choose promotion piece: q, r, b, or n");
        if (promotedTo && ['q', 'r', 'b', 'n'].includes(promotedTo.toLowerCase())) {
          game.put({ type: promotedTo.toLowerCase(), color: move.color }, to);
        } else {
          game.put({ type: 'q', color: move.color }, to);
        }
      }
      setPosition(game.fen());
    }
    socket.emit("move", {
      from: from,
      to: to,
    });
  }
  

  return (
    <div
      style={{
        margin: "3rem auto",
        maxWidth: "70vh",
        width: "70vw",
      }}
    >
      <Chessboard
        id="Configurable Board"
        position={position}
        onPieceDrop={(from, to) => {
          handleMove(from, to);
        }}
      />
      <button
        onClick={() => {
          game.reset();
          setPosition(game.fen());
          setGame(new Chess());
        }}
      >
        Reset Board
      </button>
    </div>
  );
}

export default App;