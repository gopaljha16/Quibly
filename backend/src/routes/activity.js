const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { authenticate } = require("../middleware/auth");

// Activity routes
router.post("/", authenticate, activityController.setActivity);
router.delete("/", authenticate, activityController.clearActivity);
router.get("/history", authenticate, activityController.getActivityHistory);
router.get("/:userId", activityController.getActivity);

// Custom status routes
router.post("/status", authenticate, activityController.setCustomStatus);
router.delete("/status", authenticate, activityController.clearCustomStatus);

module.exports = router;
