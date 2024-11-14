require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
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

const createUser = async () => {
    const hashedPassword = await bcrypt.hash('password', 10);
    const user = new User({ username: 'admin', password: hashedPassword });
    await user.save();
    console.log('User created');
  };
  
  // Call `createUser()` once and then remove/comment out this code.
  createUser()