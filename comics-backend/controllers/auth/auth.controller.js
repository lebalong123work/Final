const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { sendNewPasswordMail } = require("../../middleware/mailer");
const AuthModel = require("../../models/auth/auth.model");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role_code, provider: user.provider },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { username, email, phone, password } = req.body || {};

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = await AuthModel.findRoleByCode("user");
    if (!role) return res.status(500).json({ message: "Missing user role" });

    const inserted = await AuthModel.createLocalUser(username, email, phone, passwordHash, role.id);
    const user = await AuthModel.findUserWithRoleById(inserted.id);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    console.error("register error:", err);
    if (err.code === "23505") {
      if (err.constraint === "ux_users_username")
        return res.status(409).json({ message: "Username already exists" });
      if (err.constraint === "ux_users_email_provider")
        return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await AuthModel.findLocalUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Incorrect account or password" });
    if (user.status === 0) return res.status(403).json({ message: "The account has been banned." });

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return res.status(401).json({ message: "Incorrect account or password" });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        role: user.role_code,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleLogin(req, res) {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name || payload?.given_name || "";

    if (!googleId || !email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let userId;
    const found = await AuthModel.findGoogleUserById(googleId);

    if (found) {
      userId = found.id;
    } else {
      const emailUser = await AuthModel.findUserByEmail(email);
      if (emailUser && emailUser.provider === "local") {
        await AuthModel.linkGoogleId(emailUser.id, googleId);
        userId = emailUser.id;
      } else {
        const role = await AuthModel.findRoleByCode("user");
        const inserted = await AuthModel.createGoogleUser(
          name || email.split("@")[0],
          email,
          googleId,
          role.id
        );
        userId = inserted.id;
      }
    }

    const user = await AuthModel.findUserWithRoleById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Number(user.status) === 0) return res.status(403).json({ message: "Account has been banned" });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        google_id: user.google_id,
        status: user.status,
        role: user.role_code,
      },
    });
  } catch (err) {
    console.error("google auth error:", err);
    return res.status(401).json({ message: "Google token invalid" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await AuthModel.findLocalUserByEmailForReset(email);
    if (!user) return res.status(404).json({ message: "Email not found (local account)" });
    if (user.status === 0) return res.status(403).json({ message: "Account has been banned" });

    const newPassword = crypto.randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await AuthModel.updatePassword(user.id, passwordHash);
    await sendNewPasswordMail(email, newPassword);

    return res.json({ message: "New password has been sent to your email" });
  } catch (err) {
    console.error("forgot-password error:", err);
    if (String(err?.message || "").includes("Invalid login")) {
      return res.status(500).json({ message: "Invalid SMTP configuration (user/pass)" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

async function changePassword(req, res) {
  try {
    const userId = Number(req.user.id || 0);
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "Missing data" });
    if (String(newPassword).length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Password confirmation does not match" });

    const user = await AuthModel.findLocalUserByIdWithStatus(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Number(user.status) === 0) return res.status(403).json({ message: "Account has been banned" });
    if (user.provider !== "local")
      return res.status(400).json({ message: "Google account cannot use local password reset" });

    const ok = await bcrypt.compare(currentPassword, user.password_hash || "");
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash || "");
    if (sameAsOld) return res.status(400).json({ message: "The new password must not be the same as the old password." });

    const newHash = await bcrypt.hash(newPassword, 10);
    await AuthModel.updatePassword(userId, newHash);

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("change-password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login, googleLogin, forgotPassword, changePassword };
