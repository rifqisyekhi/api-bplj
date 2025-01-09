const express = require("express");
const layananController = require("../controllers/layananController");
const authenticateToken = require("../middleware/authenticate");
const upload = require("../middleware/multer");
const router = express.Router();

router.get("/", layananController.getAllLayanan);

router.get("/:id", layananController.getLayananById);

router.post(
  "/",
  authenticateToken,
  upload.single("image_layanan"),
  layananController.createLayanan
);

router.put(
  "/:id",
  authenticateToken,
  upload.single("image_layanan"),
  layananController.updateLayanan
);

router.delete("/:id", authenticateToken, layananController.deleteLayanan);

module.exports = router;
