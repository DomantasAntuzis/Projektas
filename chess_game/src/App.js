import { Chessboard } from "react-chessboard";
import { useState } from "react";
import { Chess } from "chess.js";



function App() {
  const [position, setPosition] = useState("start");
  const [game, setGame] = useState(new Chess());

  function handleMove(from, to) {
    const move = game.move({ from, to });
    if (move !== null) {
      setPosition(game.fen());
      console.log("veikia")
    }
    // console.log("veikia");
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

