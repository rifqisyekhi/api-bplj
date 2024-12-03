require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const roomSchema = require('./models/Room');
const Audience = require('./models/Audiens');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Models
const Room = mongoose.model('Room', roomSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

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

// Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// Routes
// User Authentication
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Audiences
app.post('/audiences', authenticateToken, async (req, res) => {
  const { name } = req.body;
  try {
    const newAudience = new Audience({ name });
    await newAudience.save();
    res.status(201).json(newAudience);
  } catch (error) {
    res.status(400).json({ message: 'Error creating audience', error });
  }
});

app.get('/audiences', authenticateToken, async (req, res) => {
  try {
    const audiences = await Audience.find();
    res.status(200).json(audiences);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audiences', error });
  }
});

// Meetings
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

app.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0);

    const meetings = await Meeting.find({ tanggal: { $gte: gmt7Today } }).sort({ tanggal: 1, start_time: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
});

app.get('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting', error });
  }
});

app.put('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMeeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(updatedMeeting);
  } catch (error) {
    res.status(400).json({ message: 'Error updating meeting', error });
  }
});

app.delete('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!deletedMeeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting meeting', error });
  }
});

// Rooms
app.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error });
  }
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
