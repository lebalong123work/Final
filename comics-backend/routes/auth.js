const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role_code, provider: user.provider },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Helper lấy role_code
async function getUserWithRoleById(id) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, u.phone, u.provider, u.google_id, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

/**
 * POST /api/auth/register
 * body: { username, email, phone, password }
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body || {};

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const role = await db.query(
      `SELECT id FROM roles WHERE code='user' LIMIT 1`
    );

    const roleId = role.rows[0]?.id;
    if (!roleId) {
      return res.status(500).json({ message: "Thiếu role user" });
    }

    const { rows } = await db.query(
      `INSERT INTO users (username, email, phone, provider, password_hash, role_id)
       VALUES ($1,$2,$3,'local',$4,$5)
       RETURNING id`,
      [username, email, phone, passwordHash, roleId]
    );

    const user = await getUserWithRoleById(rows[0].id);
    const token = signToken(user);

    return res.json({ token, user });

  } catch (err) {
    console.error("register error:", err);

    // 🔥 BẮT LỖI TRÙNG
    if (err.code === "23505") {
      if (err.constraint === "ux_users_username") {
        return res.status(409).json({
          message: "Tên người dùng đã tồn tại"
        });
      }

      if (err.constraint === "ux_users_email_provider") {
        return res.status(409).json({
          message: "Email đã tồn tại"
        });
      }
    }

    return res.status(500).json({
      message: "Lỗi server"
    });
  }
});


/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email/mật khẩu" });
    }

    const { rows } = await db.query(
      `SELECT u.*, r.code AS role_code
       FROM users u 
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND u.provider = 'local'
       LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    //  kiểm tra tài khoản bị khóa
    if (user.status === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

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
});

/**
 * POST /api/auth/google
 * body: { googleId, email, name }
 * (demo backend) -> bạn gửi info từ FE sau khi login google
 * Thực tế chuẩn: verify idToken với Google. Nhưng trước mắt làm luồng demo.
 */
router.post("/google", async (req, res) => {
  try {
    const { googleId, email, name } = req.body || {};
    if (!googleId || !email) {
      return res.status(400).json({ message: "Thiếu googleId/email" });
    }

    // 1) đã có user google_id?
    const found = await db.query(
      `SELECT u.id, u.provider, r.code AS role_code
       FROM users u JOIN roles r ON r.id=u.role_id
       WHERE u.google_id=$1 AND u.provider='google'
       LIMIT 1`,
      [googleId]
    );

    let userId;

    if (found.rows.length) {
      userId = found.rows[0].id;
    } else {
      // 2) tạo mới user google, role user mặc định
      const role = await db.query(`SELECT id FROM roles WHERE code='user' LIMIT 1`);
      const roleId = role.rows[0]?.id;

      const insert = await db.query(
        `INSERT INTO users (username, email, provider, google_id, role_id)
         VALUES ($1,$2,'google',$3,$4)
         RETURNING id`,
        [name || email.split("@")[0], email, googleId, roleId]
      );
      userId = insert.rows[0].id;
    }

    const user = await getUserWithRoleById(userId);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    console.error("google auth error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
