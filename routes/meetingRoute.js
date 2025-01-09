const express = require("express");
const meetingController = require("../controllers/meetingController");
const authenticateToken = require("../middleware/authenticate");
const router = express.Router();

router.post("/", authenticateToken, meetingController.createMeeting);
router.get("/", authenticateToken, meetingController.getAllMeeting);
router.get("/today", authenticateToken, meetingController.getAllTodayMeeting);
router.get("/lobby", meetingController.getAllLobbyMeeting);
router.get("/running-text", meetingController.getRunningText);
router.put("/:id", authenticateToken, meetingController.updateMeeting);
router.get("/:id", authenticateToken, meetingController.getMeetingById);
router.delete("/:id", authenticateToken, meetingController.deleteMeeting);

module.exports = router;
