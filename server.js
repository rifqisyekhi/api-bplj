require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const roomSchema = require('./models/Room');
const Audience = require('./models/Audience');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const Room = mongoose.model('Room', roomSchema);

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

function authenticateToken(req, res, next) {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
  
    // Check if the authorization header exists and starts with 'Bearer'
    if (!authHeader) return res.status(401).json({ message: 'Access Denied' });
  
    // Extract the token from the authorization header (Bearer <token>)
    const token = authHeader.split(' ')[1]; // The token is after 'Bearer'
  
    if (!token) return res.status(401).json({ message: 'Token missing' });
  
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid Token' });
  
      // Attach the user to the request object if the token is valid
      req.user = user;
      next();
    });
}

// //Token
// app.get('/validate-token', (req, res) => {
//   const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header
//   if (!token) return res.status(401).send('Token is missing');

//   try {
//     const decoded = jwt.verify(token, 'SECRET_KEY'); // Ganti dengan kunci rahasia Anda
//     res.send({ valid: true, user: decoded });
//   } catch (err) {
//     res.status(401).send('Invalid token');
//   }
// });

// app.listen(5000, () => console.log('Server is running on http://localhost:5000'));

// Routes

// User login route
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

// CRUD routes for meetings

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

// Read all meetings with filter and sort
app.get('/meetings', authenticateToken, async (req, res) => {
  try {
    // Get current date in GMT+7
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset in milliseconds
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0); // Reset to GMT+7 00:00:00

    // Query MongoDB: filter by tanggal >= today, sort by tanggal and start_time
    const meetings = await Meeting.find({
      tanggal: { $gte: gmt7Today }, // Filter by tanggal >= GMT+7 today
    }).sort({
      tanggal: 1,         // Sort by tanggal ascending
      start_time: 1,      // If same tanggal, sort by start_time ascending
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
});

// Read a single meeting by ID
app.get('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting', error });
  }
});

// Update a meeting
app.put('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMeeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(updatedMeeting);
  } catch (error) {
    res.status(400).json({ message: 'Error updating meeting', error });
  }
});

// Delete a meeting
app.delete('/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!deletedMeeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting meeting', error });
  }
});

// Read all meetings
app.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));