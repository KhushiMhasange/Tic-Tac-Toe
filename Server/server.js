const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

// const httpServer = createServer();

// const io = new Server(httpServer, {
//   cors: "http://localhost:5174/",
// });
const app = express(); 

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://tic-tac-toe-r1i7.onrender.com", 
    methods: ["GET", "POST"],
  },
});

// Serve static files from the Client build directory
app.use(express.static(path.join(__dirname, '../Client/dist'))); 

// Handle requests to the root URL by sending the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
  allUsers[socket.id] = {
    socket: socket,
    online: true,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.online && !user.playing && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }

    if (opponentPlayer) {
      allRooms.push({
        player1: opponentPlayer,
        player2: currentUser,
      });

      currentUser.socket.emit("Opponent Found", {
        OpponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("Opponent Found", {
        OpponentName: currentUser.playerName,
        playingAs: "cross",
      });

      currentUser.socket.on("playerMoveFromClient", (data) => {
        opponentPlayer.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });

      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        currentUser.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
    } else {
      currentUser.socket.emit("Opponent Not Found");
    }
  });

  socket.on("disconnect", function () {
    const currentUser = allUsers[socket.id];
    currentUser.online = false;
    currentUser.playing = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];

      if (player1.socket.id === socket.id) {
        player2.socket.emit("opponentLeftMatch");
        break;
      }

      if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeftMatch");
        break;
      }
    }
  });
});

// httpServer.listen(3000);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
