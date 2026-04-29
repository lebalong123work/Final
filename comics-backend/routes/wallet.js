const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const WalletController = require("../controllers/finance/wallet.controller");

router.post("/topup/momo", auth, WalletController.createMomoTopup);
router.get("/topup/status/:orderId", auth, WalletController.getTopupStatus);
router.get("/transactions", auth, WalletController.getTransactions);

module.exports = router;
