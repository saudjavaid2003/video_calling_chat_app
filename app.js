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

let waitingusers = [];
let room = {};

io.on("connection", function (socket) {
  socket.on("joinroom", function () {
    if (waitingusers.length > 0) {
      let partner = waitingusers.shift();
      const roomname = `${socket.id}-${partner.id}`;
      socket.join(roomname);
      partner.join(roomname);

      // Optional: store room info
      room[socket.id] = roomname;
      room[partner.id] = roomname;

      // Notify both users
      io.to(roomname).emit("joined");
    } else {
      waitingusers.push(socket);
    }
  });

  socket.on("disconnect", () => {
    // Remove from waiting list on disconnect
    let index=waitingusers.findIndex((waitinguser)=>
      waitinguser.id==socket.id
    )
    waitingusers.splice(index,1)
  });
});

// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
