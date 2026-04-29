const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const NotificationController = require("../controllers/interactions/notification.controller");

router.get("/", auth, NotificationController.getNotifications);
router.get("/unread-count", auth, NotificationController.getUnreadCount);
router.post("/:id/read", auth, NotificationController.markAsRead);

module.exports = router;
