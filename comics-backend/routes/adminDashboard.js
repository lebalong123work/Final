const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const AdminDashboardController = require("../controllers/admin/adminDashboard.controller");

router.get("/dashboard", auth, requireAdmin, AdminDashboardController.getDashboard);

module.exports = router;
