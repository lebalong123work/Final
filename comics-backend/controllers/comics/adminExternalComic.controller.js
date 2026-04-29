const AdminExternalComicModel = require("../../models/comics/adminExternalComic.model");

/**
* POST /api/admin/external-comics/sync
* Synchronize comics from otruyenapi.com to the database.
* Body: { maxPages?: number } — default 5 pages.
*/
async function sync(req, res) {
  const io          = req.app.get("io");
  const ownerUserId = req.user?.id || null;
  const maxPages    = Math.max(1, Number(req.body?.maxPages || 5));

  try {
    const stats = await AdminExternalComicModel.sync(ownerUserId, maxPages, io);

    return res.json({
      success: true,
      message: "Sync OK",
      stats,
    });
  } catch (err) {
    console.error("SYNC external error:", err);
    return res.status(500).json({ message: err?.message || "Sync error" });
  }
}

/**
* PATCH /api/admin/external-comics/:apiId/pricing
* Updates the price settings (free/paid) for external comics.
* Body: { is_paid: boolean, price: number }
*/
async function updatePricing(req, res) {
  try {
    const { apiId } = req.params;
    const isPaid    = !!req.body.is_paid;
    const price     = Math.max(0, Number(req.body.price || 0));

    if (isPaid && price <= 0) {
      return res.status(400).json({ message: "Price must be > 0 when enabling paid option" });
    }

    const row = await AdminExternalComicModel.updatePricing(apiId, isPaid, price);

    if (!row) return res.status(404).json({ message: "Comic not found" });

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error("PATCH pricing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { sync, updatePricing };
