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

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use("/", indexRoutes);

let waitingUsers = [];  // Changed to camelCase
let rooms = {};         // Changed to plural and more descriptive

io.on("connection", function (socket) {
  console.log(`New connection: ${socket.id}`);

  socket.on("joinroom", function () {
    if (waitingUsers.length > 0) {
      let partner = waitingUsers.shift();
      const roomName = `${socket.id}-${partner.id}`;
      
      // Join the room for both users
      socket.join(roomName);
      partner.join(roomName);

      // Store room info
      rooms[socket.id] = roomName;
      rooms[partner.id] = roomName;

      // Notify both users
      io.to(roomName).emit("joined", roomName);
      console.log(`Room created: ${roomName}`);
    } else {
      waitingUsers.push(socket);
      console.log(`User ${socket.id} waiting for partner`);
    }
  });

  socket.on("message", function(data) {
    if (!data.room || !rooms[socket.id]) {
      console.error("Invalid room for message");
      return;
    }
    socket.to(data.room).emit("message", data.message);  // Fixed broadcast to room
    console.log(`Message in ${data.room}: ${data.message}`);
  });

  socket.on("disconnect", () => {
    // Clean up waiting users
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);
    
    // Clean up room assignments
    if (rooms[socket.id]) {
      const roomName = rooms[socket.id];
      delete rooms[socket.id];
      console.log(`User ${socket.id} disconnected from ${roomName}`);
    } else {
      console.log(`User ${socket.id} disconnected`);
    }
  });
socket.on("startVideoCall", function({ room }) {  // Fixed parentheses and destructuring
    socket.to(room).emit("incomingCall", {        // Fixed typo in "incomingCall"
        from: socket.id,
        timestamp: Date.now()
    });
});
socket.on("acceptCall", function({ room }) {
  console.log("vamoss",room);
  //yahan per masla ha 
});
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
