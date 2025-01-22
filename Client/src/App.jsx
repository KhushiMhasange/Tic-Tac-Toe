/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
// import  { useRef } from "react";
import "./App.css";
import winSound from "./assets/win-sound.wav"
import lostSound from "./assets/lost-sound.wav"
import bgSound from "./assets/bg-sound.mp3"
import { io } from "socket.io-client";
import Square from "./Square/Square";
import Confetti from "react-confetti";
import Swal from "sweetalert2";

//start from 2:31

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const App = () => {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playWithFriends, setPlayWithFriends] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [OpponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  

  const checkWinner = () => {
    //row dynamic that any row has all same move (O or X)
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }
    //col dynamic that any col has all same move (O or X)
    for (let col = 0; col < gameState.length; col++) {
      if (
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }
    //for diagonal both row and col dynamic
    let row = 0,
      col = 0;
    if (
      gameState[row][col] === gameState[row + 1][col + 1] &&
      gameState[row + 1][col + 1] === gameState[row + 2][col + 2]
    ) {
      setFinishedArrayState([
        row * 3 + col,
        (row + 1) * 3 + col + 1,
        (row + 2) * 3 + col + 2,
      ]);
      return gameState[row][col];
    }

    (row = 0), (col = 2);
    if (
      gameState[row][col] === gameState[row + 1][col - 1] &&
      gameState[row + 1][col - 1] === gameState[row + 2][col - 2]
    ) {
      setFinishedArrayState([
        row * 3 + col,
        (row + 1) * 3 + col - 1,
        (row + 2) * 3 + col - 2,
      ]);
      return gameState[row][col];
    }

    const isDrawMatch = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    });

    if (isDrawMatch) return "draw";

    return null;
  };

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishedState(winner);
    }
  }, [checkWinner, gameState]); //gameState is the dependency array here

  useEffect(()=>{
    const audio = new Audio(bgSound);
     if(!finishedState && finishedState !== "draw" && finishedState !== "opponentLeftMatch"){
      audio.volume = 0.5;
      audio.loop = true;
      audio.play();
     }else{
      audio.pause();
     }
  },[finishedState,OpponentName]);
  
  useEffect(() => {
    if (finishedState === playingAs) {
      setShowConfetti(true);
      const winAudio = new Audio(winSound);
      winAudio.play();
  
      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (finishedState && finishedState !== "draw" && finishedState !== "opponentLeftMatch") {
      const loseAudio = new Audio(lostSound);
      loseAudio.play();
    }
  }, [finishedState, playingAs]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
    return result;
  };

  socket?.on("opponentLeftMatch",()=>{
      setFinishedState("opponentLeftMatch");
      // setPlayWithFriends(false);
  })

  //predefined event - connect for fronted and connection for backend

  socket?.on("playerMoveFromServer",(data)=>{
    const id = data.state.id;
    setGameState((prevState)=>{
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign==="circle"?"cross":"circle");
  });

  socket?.on("connect", function () {
    setPlayWithFriends(true);
  });

  socket?.on("Opponent Not Found", function () {
    setOpponentName(false);
  });

  socket?.on("Opponent Found", function (data) {
    setPlayingAs(data.playingAs);
    setOpponentName(data.OpponentName);
  });

  async function playWithFriendsClick() {
    const result = await takePlayerName();

    if (!result.isConfirmed) {
      return;
    }
    const username = result.value;
    setPlayerName(username);
    
    //https://tic-tac-toe-backend-damy.onrender.com
    const newSocket = io("https://tic-tac-toe-backend-damy.onrender.com", {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play", {
      playerName: username,
    });

    setSocket(newSocket);
  }

  if (!playWithFriends) {
    return (
      <div className="main-div-before">
        <h1 className="game-heading-before">TIC TAC TOE</h1>
        <button onClick={playWithFriendsClick} className="play-with-friends">
          Play with Friends
        </button>
      </div>
    );
  }

  if (playWithFriends && !OpponentName) {
    return (
      <div className="waiting">
        <h2>Waiting for opponent . . .</h2>
      </div>
    )
  }

  return (
    <div className="main-div">
      <div className="move-detection">
        <div className={`left ${currentPlayer===playingAs ? "current-move-"+currentPlayer:''}`}>{playerName}</div>
        <div className={`right ${currentPlayer!==playingAs ? "current-move-"+currentPlayer:''}`}>{OpponentName}</div>
      </div>
      <div>
        <h1 className="game-heading heading-bg">TIC TAC TOE</h1>
        <div className="square-wrapper">
          {gameState.map((arr, rowIndex) =>
            arr.map((e, colIndex) => {
              return (
                <Square
                  socket={socket}
                  gameState={gameState}
                  playingAs={playingAs}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  finishedState={finishedState}
                  finishedArrayState={finishedArrayState}
                  setGameState={setGameState}
                  id={rowIndex * 3 + colIndex}
                  key={rowIndex * 3 + colIndex}
                  currentElement={e}
                />
              );
            })
          )}
        </div>
        {finishedState && 
        finishedState !== "opponentLeftMatch" && 
        finishedState !== "draw" && (
          <>
            <h3 className="finished-state">
              {finishedState === playingAs ? "You " : OpponentName} won the match
            </h3>
            {/* <audio key={finishedState} src={ finishedState === playingAs ? winSound : lostSound} autoPlay /> */}
          </>
        )
        }
        {showConfetti && <Confetti />}
        {finishedState && finishedState !=="opponentLeftMatch" && finishedState === "draw" && (
          <>
          <h3 className="finished-state">It&apos;s a Draw</h3>
          <audio key={finishedState} src={lostSound} autoPlay />
          </>
        )}
        </div>
        {!finishedState && OpponentName && (
          <h2>
            You are playing against {OpponentName} 
          </h2>
        )}
        {finishedState && finishedState ==="opponentLeftMatch" && (
          <>
          <h3>
            You won the Match, {OpponentName} Left
          </h3>
          <audio key={finishedState}  src={winSound} autoPlay />
          </>
        )}
    </div>
  );
};

export default App;
