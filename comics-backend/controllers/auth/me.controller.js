const MeModel = require("../../models/auth/me.model");

async function getMe(req, res) {
  try {
    const result = await MeModel.getUserWithWallet(req.user.id);
    if (!result) return res.status(404).json({ message: "User does not exist." });
    return res.json({ user: result.user, wallet: result.wallet });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getMe };
