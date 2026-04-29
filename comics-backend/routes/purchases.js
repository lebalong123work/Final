const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const PurchaseController = require("../controllers/finance/purchase.controller");

// Check access permissions (read-only — no financial transactions)
router.get("/access/:slug",     auth, PurchaseController.checkAccessExternal);
router.get("/access-self/:id",  auth, PurchaseController.checkAccessSelf);

module.exports = router;
