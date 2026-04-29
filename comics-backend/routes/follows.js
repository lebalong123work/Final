const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const FollowController = require("../controllers/interactions/follow.controller");

router.get("/me/stats", auth, FollowController.getMyStats);
router.post("/:userId/toggle", auth, FollowController.toggleFollow);
router.get("/:userId/status", auth, FollowController.getFollowStatus);

module.exports = router;
