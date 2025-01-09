const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { syncDatabase } = require("./config/database");

// Import controllers
const roomRouter = require("./routes/roomRoute");
const audienceRouter = require("./routes/audienceRoute");
const userRouter = require("./routes/userRoute");
const meetingRouter = require("./routes/meetingRoute");
const layananRouter = require("./routes/layananRoute");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Static folder for uploads
app.use("/api/uploads", express.static("uploads"));

// Sync database
(async () => {
  try {
    await syncDatabase();
    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Failed to sync database:", error);
    process.exit(1);
  }
})();

// Routes
app.use("/api/room", roomRouter);
app.use("/api/audience", audienceRouter);
app.use("/api/user", userRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/layanan", layananRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

// Start server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
