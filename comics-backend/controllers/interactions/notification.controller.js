const NotificationModel = require("../../models/interactions/notification.model");

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const data = await NotificationModel.getNotificationsByUser(userId);
    return res.json({ success: true, data });
  } catch (e) {
    console.error("get notifications error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const unread = await NotificationModel.getUnreadCount(userId);
    return res.json({ success: true, data: { unread } });
  } catch (e) {
    console.error("unread count error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    await NotificationModel.markAsRead(id, userId);
    const unread = await NotificationModel.getUnreadCount(userId);

    const io = req.app.get("io");
    io?.to(`user:${userId}`).emit("notif:unread", { unread });

    return res.json({ success: true, data: { unread } });
  } catch (e) {
    console.error("mark read error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getNotifications, getUnreadCount, markAsRead };
