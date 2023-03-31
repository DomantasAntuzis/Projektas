import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Chess } from "chess.js";
import Timer from "./timer";
import "./style.css";

function App() {
  const [position, setPosition] = useState("start");
  const [game, setGame] = useState(new Chess());
  const [socket, setSocket] = useState(null);
  const [turn, setTurn] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [whiteTime, setWhiteTime] = useState(300);
  const [blackTime, setBlackTime] = useState(300);
  const [turnText, setTurnText] = useState("waiting for another player");
  const [winnerText, setWinnerText] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);

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


  // timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (turn === "w" && whiteTime > 0) {
        setWhiteTime((whiteTime) => whiteTime - 1);
        if (whiteTime === 1) {
          setWinnerText("Game over! Blacks won");
          clearInterval(interval);
          setTimerExpired(true);
        }
      } else if (turn === "b" && blackTime > 0) {
        setBlackTime((blackTime) => blackTime - 1);
        if (blackTime === 1) {
          setWinnerText("Game over! Whites won");
          clearInterval(interval);
          setTimerExpired(true);
        }
      } else {
        clearInterval(interval);
      }
    }, 1000);

    if (game.isCheckmate()) {
    clearInterval(interval)
    }

    return () => {
      clearInterval(interval);
    };
  }, [turn, whiteTime, blackTime, socket, game]);

  //color assignment, fen, time, turn
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

    socket.on("time", (time) => {
      setWhiteTime(time.w);
      setBlackTime(time.b);
    });

    socket.on("turn", (turn) => {
      console.log(`Received turn from server: ${turn}`);
      setTurn(turn);
      if (turn === "w") {
        setTurnText("whites move");
      } else if (turn === "b") {
        setTurnText("blacks move");
      }
    });

    if (timerExpired) {
      return;
    }

    const onFocus = () => {
      socket.emit("updateTime", 1);
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [socket, turn, playerColor, whiteTime, blackTime]);

  //text
  useEffect(() => {
    if (game.isGameOver()) {
      setTimerExpired(true);
      if (game.isCheckmate()) {
        setWinnerText(
          `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`
        );
      } else {
        setWinnerText("Draw!");
      }
    }
  }, [game]);

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
        if (
          (turn === "w" && whiteTime === 0) ||
          (turn === "b" && blackTime === 0)
        ) {
          return;
        }
        socket.emit("move", {
          from: from,
          to: to,
        });
        setPosition(game.fen());
        setTurn(game.turn());
      }
    }
  }

  return (
    <div className="main">
      <div className="chessboard-container">
        {winnerText ? <h3>{winnerText}</h3> : <h3>{turnText}</h3>}
        <p>
          Playing as{" "}
          {playerColor ? (playerColor === "w" ? "white" : "black") : "unknown"}
        </p>
        <Chessboard
          id="Configurable Board"
          position={position}
          onPieceDrop={(from, to) => {
            if (game.turn() === turn && playerColor === game.turn()) {
              handleMove(from, to);
            }
          }}
        />
      </div>
      <div className="timer-container">
        <Timer className="timer" wtime={whiteTime} btime={blackTime}></Timer>
      </div>
    </div>
  );
}

export default App;
