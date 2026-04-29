const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // {id, role, provider}
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  const role = req.user?.role;

  if (!["admin", "sub_admin"].includes(role)) {
    return res.status(403).json({ message: "This chapter was popular." });
  }

  next();
}
module.exports = { auth, requireAdmin };
