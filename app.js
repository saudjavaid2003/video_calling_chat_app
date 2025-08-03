// server.js
const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Import routes
const indexRoutes = require("./routes/index");

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // optional if "views" is in root

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use index routes
app.use("/", indexRoutes);

// Socket-related data
let waitingUsers = [];
let rooms = {};

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Matchmaking
  socket.on("joinroom", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      const roomName = `${socket.id}-${partner.id}`;

      socket.join(roomName);
      partner.join(roomName);

      rooms[socket.id] = roomName;
      rooms[partner.id] = roomName;

      io.to(roomName).emit("joined", roomName);
      console.log(`Room created: ${roomName}`);
    } else {
      waitingUsers.push(socket);
      console.log(`User ${socket.id} waiting for partner`);
    }
  });

  // Text messaging
  socket.on("message", ({ room, message }) => {
    if (!room || !rooms[socket.id]) {
      console.error("Invalid room or user not in room");
      return;
    }
    socket.to(room).emit("message", message);
    console.log(`Message in ${room}: ${message}`);
  });

  // Video call request
  socket.on("startVideoCall", ({ room }) => {
    if (room) {
      socket.to(room).emit("incomingCall", {
        from: socket.id,
        timestamp: Date.now()
      });
      console.log(`Video call initiated by ${socket.id} in room ${room}`);
    }
  });

  // Video call acceptance
  socket.on("acceptCall", ({ room }) => {
    if (room) {
      console.log(`Call accepted in room: ${room}`);
      socket.to(room).emit("callAccepted");
    }
  });

  // Video call rejection (optional)
  socket.on("rejectCall", ({ room }) => {
    if (room) {
      socket.to(room).emit("callRejected");
      console.log(`Call rejected in room: ${room}`);
    }
  });

  // Signaling for WebRTC
  socket.on("signalingMessage", ({ room, message }) => {
    if (room) {
      socket.to(room).emit("signalingMessage", message);
    }
  });

  // Disconnection
  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);

    if (rooms[socket.id]) {
      const roomName = rooms[socket.id];
      delete rooms[socket.id];
      socket.to(roomName).emit("peerDisconnected");
      console.log(`User ${socket.id} disconnected from ${roomName}`);
    } else {
      console.log(`User ${socket.id} disconnected`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
