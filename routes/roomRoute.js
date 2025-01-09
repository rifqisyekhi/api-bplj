const express = require("express");
const roomController = require("../controllers/roomController");
const authenticateToken = require("../middleware/authenticate");
const router = express.Router();

router.get("/", authenticateToken, roomController.getAllRoom);
router.post("/", authenticateToken, roomController.createRoom);

module.exports = router;
