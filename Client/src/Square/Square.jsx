/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from "react";
import moveSound from "../assets/move-sound.wav";
import "./Square.css";

const circleSvg = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>{" "}
    </g>
  </svg>
);

const crossSvg = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <path
        d="M19 5L5 19M5.00001 5L19 19"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>{" "}
    </g>
  </svg>
);

const Square = ({
  socket,
  gameState,
  playingAs,
  currentElement,
  currentPlayer,
  setCurrentPlayer,
  finishedState,
  setFinishedState,
  finishedArrayState,
  setGameState,
  id,
}) => {
  const [icon, setIcon] = useState(null);
  
  const clickOnSquare = () => {

    if(playingAs !== currentPlayer){
      return;
    }

    if (finishedState) {
      return;
    }
    
    if (!icon) {
      const audio = new Audio(moveSound);
      audio.play();
      
      if (currentPlayer === "circle"){ setIcon(circleSvg)}
      else{ setIcon(crossSvg)};
    
      const myCurrentPlayer = currentPlayer;
      //to toggle player
      socket.emit("playerMoveFromClient", {
        state: {
          id,
          sign: currentPlayer,
        },
      });

      setCurrentPlayer(currentPlayer === "circle" ? "cross" : "circle");

      setGameState((prevState) => {
        let newState = [...prevState]; //creating a deep copy of prevstate array 3X3
        const rowIndex = Math.floor(id / 3);
        const colIndex = id % 3;
        //updating the state in array to 'circle' or 'cross' as per current player
        newState[rowIndex][colIndex] = myCurrentPlayer;
        // console.log(newState);
        return newState;
      });
    }
  };
  return (
    <div
      onClick={clickOnSquare}
      className={`square ${finishedState ? "not-allowed" : ""} 
      ${currentPlayer!==playingAs? "not-allowed" : ""}
      ${finishedArrayState.includes(id) ? finishedState + "-won" : ""}
      ${finishedState && finishedState !==playingAs ? "grey-background" : ""}`
    }
    >
      {currentElement === "circle"
        ? circleSvg
        : currentElement === "cross"
        ? crossSvg
        : icon}
    </div>
  );
};

export default Square;
