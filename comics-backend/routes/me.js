const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const MeController = require("../controllers/auth/me.controller");

router.get("/", auth, MeController.getMe);

module.exports = router;
