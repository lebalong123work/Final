const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto");
const { sendNewPasswordMail } = require("../middleware/mailer");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
const { auth } = require("../middleware/auth");
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role_code, provider: user.provider },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function getUserWithRoleById(id) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, u.phone, u.provider, u.google_id, u.status,
            r.code AS role_code
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


router.post("/change-password", auth, async (req, res) => {
  try {
    const userId = Number(req.user.id || 0);
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Xác nhận mật khẩu không khớp" });
    }

    const { rows } = await db.query(
      `
      SELECT id, email, provider, password_hash, status
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (Number(user.status) === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    if (user.provider !== "local") {
      return res.status(400).json({
        message: "Tài khoản Google không dùng chức năng đổi mật khẩu local",
      });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash || "");
    if (!ok) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash || "");
    if (sameAsOld) {
      return res.status(400).json({ message: "Mật khẩu mới không được trùng mật khẩu cũ" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      `,
      [newHash, userId]
    );

    return res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (err) {
    console.error("change-password error:", err);
    return res.status(500).json({ message: "Lỗi server" });
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


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
// body: { credential }  // credential = id_token từ GoogleLogin
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ message: "Thiếu credential" });

   
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // payload gồm: sub (google user id), email, name, picture...
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name || payload?.given_name || "";

    if (!googleId || !email) {
      return res.status(400).json({ message: "Token Google không hợp lệ" });
    }

    // 1) tìm user theo provider google
    const found = await db.query(
      `SELECT u.id
       FROM users u
       WHERE u.google_id=$1 AND u.provider='google'
       LIMIT 1`,
      [googleId]
    );

    let userId;

    if (found.rows.length) {
      userId = found.rows[0].id;
    } else {
     
      const emailExists = await db.query(
        `SELECT id, provider FROM users WHERE email=$1 LIMIT 1`,
        [email]
      );

      if (emailExists.rows.length && emailExists.rows[0].provider === "local") {
      
        await db.query(
          `UPDATE users SET google_id=$1 WHERE id=$2`,
          [googleId, emailExists.rows[0].id]
        );
        userId = emailExists.rows[0].id;
      } else {
        // tạo mới user google
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
    }

    const user = await getUserWithRoleById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
if (Number(user.status) === 0) {
  return res.status(403).json({ message: "Tài khoản đã bị khóa" });
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
    google_id: user.google_id,
    status: user.status,
    role: user.role_code, 
  },
});
  
  } catch (err) {
    console.error("google auth error:", err);
    return res.status(401).json({ message: "Google token invalid" });
  }
});

// POST /api/auth/forgot-password
// body: { email }
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Thiếu email" });

    // chỉ xử lý local
    const { rows } = await db.query(
      `SELECT id, status
       FROM users
       WHERE email=$1 AND provider='local'
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Email không tồn tại (tài khoản local)" });
    }

    // nếu tài khoản bị khóa thì không cho reset
    if (rows[0].status === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    const userId = rows[0].id;

    // Tạo mật khẩu mới random (10-12 ký tự)
    const newPassword = crypto.randomBytes(6).toString("base64url"); // ví dụ: 9-10 ký tự an toàn
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password_hash=$1
       WHERE id=$2`,
      [passwordHash, userId]
    );

    // gửi mail
    await sendNewPasswordMail(email, newPassword);

    return res.json({ message: "Đã gửi mật khẩu mới về email" });
  } catch (err) {
    console.error("forgot-password error:", err);

    // lỗi SMTP / auth
    if (String(err?.message || "").includes("Invalid login")) {
      return res.status(500).json({ message: "Sai cấu hình SMTP (user/pass)" });
    }

    return res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
