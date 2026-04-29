const express = require("express");
const router = express.Router();
const MomoController = require("../controllers/finance/momo.controller");

// IPN callback from MoMo — no authentication required (MoMo calls directly)
router.post("/return-confirm", MomoController.returnConfirm);

module.exports = router;
