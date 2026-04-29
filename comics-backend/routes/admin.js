const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const AdminUserController = require("../controllers/admin/adminUser.controller");
const AdminFinanceController = require("../controllers/admin/adminFinance.controller");

// Change user permissions
router.put("/users/:id/role", auth, requireAdmin, AdminUserController.updateUserRole);

// Transaction history across the entire system (fallback — already exists in adminFinance)
router.get("/wallet/transactions", auth, requireAdmin, AdminFinanceController.getAllTransactions);

module.exports = router;
