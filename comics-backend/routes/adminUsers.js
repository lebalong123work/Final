const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const AdminUserController = require("../controllers/admin/adminUser.controller");

router.get("/users", auth, requireAdmin, AdminUserController.listUsers);
router.patch("/users/:id/status", auth, requireAdmin, AdminUserController.updateUserStatus);
router.patch("/users/:id/role", auth, requireAdmin, AdminUserController.updateUserRole);
router.patch("/users/:id", auth, requireAdmin, AdminUserController.updateUserInfo);

module.exports = router;
