const express = require("express");
const audienceController = require("../controllers/audienceController");
const authenticateToken = require("../middleware/authenticate");
const router = express.Router();

router.post("/", authenticateToken, audienceController.createAudience);
router.get("/", authenticateToken, audienceController.getAllAudience);

module.exports = router;
