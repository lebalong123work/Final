const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const AuthController = require("../controllers/auth/auth.controller");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/change-password", auth, AuthController.changePassword);

module.exports = router;
