const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const AdminFinanceController = require("../controllers/admin/adminFinance.controller");

router.get("/finance/overview",     auth, requireAdmin, AdminFinanceController.getOverview);
router.get("/finance/topups",       auth, requireAdmin, AdminFinanceController.getTopups);
router.get("/wallet/transactions",  auth, requireAdmin, AdminFinanceController.getAllTransactions);

module.exports = router;
