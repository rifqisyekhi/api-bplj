require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Room = require('./models/room');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Meeting Schema and Model
const meetingSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  tanggal: { type: Date, required: true },
  tempat: { type: String, required: true },
  audiens: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  keterangan: { type: String }
});

const Meeting = mongoose.model('Meeting', meetingSchema);

// Middleware for JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Access Denied' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });

    req.user = user;
    next();
  });
}

// Routes for Rooms

// Create a room
app.post('/rooms', authenticateToken, async (req, res) => {
  const { name, capacity, location_type } = req.body;
  try {
    const newRoom = new Room({ name, capacity, location_type });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ message: 'Error creating room', error });
  }
});

// Fetch all rooms
app.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error });
  }
});

// CRUD Routes for Meetings

// Create a meeting
app.post('/meetings', authenticateToken, async (req, res) => {
  const { judul, tanggal, tempat, audiens, start_time, end_time, keterangan } = req.body;
  try {
    const newMeeting = new Meeting({ judul, tanggal, tempat, audiens, start_time, end_time, keterangan });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(400).json({ message: 'Error creating meeting', error });
  }
});

// Fetch all meetings
app.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
