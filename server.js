require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const roomSchema = require("./models/Room");
const Audience = require("./models/Audiens");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Directory to store files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."));
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Models
const Room = roomSchema;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const meetingSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  tanggal: { type: Date, required: true },
  tempat: { type: String, required: true },
  audiens: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  keterangan: { type: String },
});
const Meeting = mongoose.model("Meeting", meetingSchema);

const layananSchema = new mongoose.Schema({
  namaLayanan: { type: String, required: true },
  imageLayanan: { type: String, required: true }, // Path to the uploaded image
  deskripsi: { type: String, required: true },
  standarAcuan: { type: String, required: true },
  biayaTarif: { type: String, required: true },
  produk: { type: String, required: true },
});

const Layanan = mongoose.model("Layanan", layananSchema);

// Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
}

// Routes
// User Authentication
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Audiences
app.post("/audiences", authenticateToken, async (req, res) => {
  const { name } = req.body;
  try {
    const newAudience = new Audience({ name });
    await newAudience.save();
    res.status(201).json(newAudience);
  } catch (error) {
    res.status(400).json({ message: "Error creating audience", error });
  }
});

app.get("/audiences", authenticateToken, async (req, res) => {
  try {
    const audiences = await Audience.find();
    res.status(200).json(audiences);
  } catch (error) {
    res.status(500).json({ message: "Error fetching audiences", error });
  }
});

// Meetings
app.post("/meetings", authenticateToken, async (req, res) => {
  const { judul, tanggal, tempat, audiens, start_time, end_time, keterangan } =
    req.body;
  try {
    const newMeeting = new Meeting({
      judul,
      tanggal,
      tempat,
      audiens,
      start_time,
      end_time,
      keterangan,
    });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(400).json({ message: "Error creating meeting", error });
  }
});

app.get("/meetings", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0);

    const meetings = await Meeting.find({ tanggal: { $gte: gmt7Today } }).sort({
      tanggal: 1,
      start_time: 1,
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
});

app.get("/lobby-meetings", async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);

    // Set current time to start of the day in GMT+7
    gmt7Today.setUTCHours(0, 0, 0, 0); // Set hours to 00:00:00

    // Get the current time in GMT+7 (HH:mm format)
    const hours = gmt7Today.getHours().toString().padStart(2, "0");
    const minutes = gmt7Today.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    // Define query to find meetings where the end time is greater than the current time
    const meetings = await Meeting.find({
      $and: [
        { tanggal: { $gte: gmt7Today } }, // Ensure the meeting date is today or later
        { end_time: { $gt: currentTime } }, // Ensure the meeting end time is greater than current time
      ],
    })
      .sort({ tanggal: 1, start_time: 1 }) // Sort by date and start time
      .limit(4); // Limit results to 4 meetings

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
});

app.get("/running-text", async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);

    // Set current time to start of the day in GMT+7
    gmt7Today.setUTCHours(0, 0, 0, 0); // Set hours to 00:00:00

    // Get the current time in GMT+7 (HH:mm format)
    const hours = gmt7Today.getHours().toString().padStart(2, "0");
    const minutes = gmt7Today.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    // Try to find meetings for today
    let meetings = await Meeting.find({
      $and: [
        { tanggal: { $gte: gmt7Today } }, // Ensure the meeting date is today or later
        { end_time: { $gt: currentTime } }, // Ensure the meeting end time is greater than current time
      ],
    })
      .sort({ tanggal: 1, start_time: 1 }) // Sort by date and start time
      .limit(4); // Limit results to 4 meetings

    // If no meetings found today, fetch the next meeting (future dates)
    if (meetings.length === 0) {
      meetings = await Meeting.find({ tanggal: { $gte: gmt7Today } })
        .sort({ tanggal: 1, start_time: 1 }) // Sort by date and start time
        .limit(1); // Get the next upcoming meeting
    }

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
});

app.get("/meetings/:id", authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meeting", error });
  }
});

app.put("/meetings/:id", authenticateToken, async (req, res) => {
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMeeting)
      return res.status(404).json({ message: "Meeting not found" });
    res.json(updatedMeeting);
  } catch (error) {
    res.status(400).json({ message: "Error updating meeting", error });
  }
});

app.delete("/meetings/:id", authenticateToken, async (req, res) => {
  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!deletedMeeting)
      return res.status(404).json({ message: "Meeting not found" });
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting meeting", error });
  }
});

// Rooms
app.get("/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
});

app.get("/test", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Test success" });
});

app.post(
  "/layanan",
  authenticateToken,
  upload.single("imageLayanan"),
  async (req, res) => {
    try {
      const { namaLayanan, deskripsi, standarAcuan, biayaTarif, produk } =
        req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Image is required." });
      }

      const newLayanan = new Layanan({
        namaLayanan,
        imageLayanan: req.file.path, // Store the file path
        deskripsi,
        standarAcuan,
        biayaTarif,
        produk,
      });

      await newLayanan.save();
      res.status(201).json(newLayanan);
    } catch (error) {
      console.error("Error creating layanan:", error);
      res.status(500).json({ message: "Error creating layanan", error });
    }
  }
);

app.get("/layanan", async (req, res) => {
  try {
    const layanan = await Layanan.find();
    res.status(200).json(layanan);
  } catch (error) {
    console.error("Error fetching layanan:", error);
    res.status(500).json({ message: "Error fetching layanan", error });
  }
});

app.get("/layanan-pengujian/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the request parameters
    const layananDetail = await Layanan.findById(id); // Find the layanan by ID

    if (!layananDetail) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    res.status(200).json(layananDetail); // Send the found layanan details
  } catch (error) {
    console.error("Error fetching layanan detail:", error);
    res.status(500).json({ message: "Error fetching layanan detail", error });
  }
});

// Update Layanan
app.put(
  "/layanan/:id",
  authenticateToken,
  upload.single("imageLayanan"), // Optional file upload
  async (req, res) => {
    try {
      const { namaLayanan, deskripsi, standarAcuan, biayaTarif, produk } = req.body;
      const updatedData = { namaLayanan, deskripsi, standarAcuan, biayaTarif, produk };

      // If a new file is uploaded, update the image path
      if (req.file) {
        updatedData.imageLayanan = req.file.path;
      }

      const updatedLayanan = await Layanan.findByIdAndUpdate(
        req.params.id,
        updatedData,
        { new: true } // Return the updated document
      );

      if (!updatedLayanan) {
        return res.status(404).json({ message: "Layanan not found" });
      }

      res.status(200).json(updatedLayanan);
    } catch (error) {
      console.error("Error updating layanan:", error);
      res.status(500).json({ message: "Error updating layanan", error });
    }
  }
);

// Delete Layanan
app.delete("/layanan/:id", authenticateToken, async (req, res) => {
  try {
    const deletedLayanan = await Layanan.findByIdAndDelete(req.params.id);

    if (!deletedLayanan) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    res.status(200).json({ message: "Layanan deleted successfully" });
  } catch (error) {
    console.error("Error deleting layanan:", error);
    res.status(500).json({ message: "Error deleting layanan", error });
  }
});

app.delete("/layanan/:id", authenticateToken, async (req, res) => {
  try {
    const layanan = await Layanan.findById(req.params.id);

    if (!layanan) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    // Remove the file if it exists
    if (layanan.imageLayanan) {
      fs.unlink(layanan.imageLayanan, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    // Delete the record from the database
    await Layanan.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Layanan deleted successfully" });
  } catch (error) {
    console.error("Error deleting layanan:", error);
    res.status(500).json({ message: "Error deleting layanan", error });
  }
});

// Server Initialization
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
