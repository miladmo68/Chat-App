var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.Promise = global.Promise;

var dbUrl =
  "mongodb+srv://user:12345@nodedb.jbihq.mongodb.net/yourDatabaseName?retryWrites=true&w=majority";
var Message = mongoose.model("Message", {
  name: String,
  message: String,
});

// GET all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find({});
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET messages by user
app.get("/messages/:user", async (req, res) => {
  try {
    const user = req.params.user;
    const messages = await Message.find({ name: user });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// POST message
app.post("/messages", async (req, res) => {
  try {
    var message = new Message(req.body);
    var savedMessage = await message.save();

    console.log("saved");

    var censored = await Message.findOne({ message: "badword" });

    if (censored) {
      await Message.deleteOne({ _id: censored.id });
    } else {
      io.emit("message", req.body);
    }

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    console.error(error);
  } finally {
    console.log("message post called");
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("a user connected");
});

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectDB();

// Start server
var server = http.listen(3000, () => {
  console.log("server is listening on port", server.address().port);
});
