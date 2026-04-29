const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const PurchaseController = require("../controllers/finance/purchase.controller");

// Purchase the comic (involves a financial transaction — using PostgreSQL transaction)
router.post("/buy/:slug",       auth, PurchaseController.buyExternal);
router.post("/buy-self/:id",    auth, PurchaseController.buySelf);

// Check access permissions (redundant with purchases.js — keep for compatibility)
router.get("/access/:slug",     auth, PurchaseController.checkAccessExternal);
router.get("/access-self/:id",  auth, PurchaseController.checkAccessSelf);

module.exports = router;
