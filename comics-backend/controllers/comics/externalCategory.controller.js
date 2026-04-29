const ExternalCategoryModel = require("../../models/comics/externalCategory.model");

async function list(req, res) {
  try {
    const data = await ExternalCategoryModel.list();
    return res.json({ success: true, total: data.length, data });
  } catch (err) {
    console.error("GET /api/external-categories error:", err);
    return res.status(500).json({ success: false, message: "Server error when retrieving categories" });
  }
}

module.exports = { list };
