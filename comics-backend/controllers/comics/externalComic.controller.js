const ExternalComicModel = require("../../models/comics/externalComic.model");

/**
* GET /api/external-comics
* List of external comics with pagination, name search, and genre filtering.
*/
async function list(req, res) {
  try {
    const page     = Math.max(1, Number(req.query.page  || 1));
    const limit    = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const q        = (req.query.q        || "").trim();
    const category = (req.query.category || "").trim();

    const result = await ExternalComicModel.list({ page, limit, q, category });

    return res.json({ success: true, page, limit, ...result });
  } catch (err) {
    console.error("GET /api/external-comics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
* PUT /api/external-comics/:slug/translator
* Update (or delete) the translator for the comic.
* Only the owner or admin/sub_admin has this permission.
*/
async function updateTranslator(req, res) {
  try {
    const slug     = String(req.params.slug || "").trim();
    const userId   = Number(req.user?.id   || 0);
    const userRole = String(req.user?.role  || "").trim();

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!slug)   return res.status(400).json({ message: "Missing slug or api_id" });

    let { translator } = req.body || {};

    if (translator === undefined) {
      return res.status(400).json({ message: "Missing translator field" });
    }

    if (translator === null) {
      translator = null;
    } else {
      translator = String(translator).trim();
      if (!translator) translator = null;
      if (translator && translator.length > 255) {
        return res.status(400).json({ message: "Translator maximum 255 characters" });
      }
    }

    const comic = await ExternalComicModel.findBySlug(slug);
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const isAdmin = userRole === "admin" || userRole === "sub_admin";
    const isOwner = Number(comic.owner_user_id || 0) === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You do not have permission to update the translator" });
    }

    const updated = await ExternalComicModel.updateTranslator(comic.id, translator);

    return res.json({
      success: true,
      message: translator ? "Translator update successful" : "Translator deleted successfully",
      data: updated,
    });
  } catch (err) {
    console.error("PUT /api/external-comics/:slug/translator error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/external-comics/:slug/pricing
 * Get the pricing information of the comic. Return default values if not found in the DB.
 */
async function getPricing(req, res) {
  try {
    const { slug } = req.params;
    const row = await ExternalComicModel.getPricing(slug);

    if (!row) {
      return res.json({
        success: true,
        data: { id: null, api_id: null, slug, name: null, is_paid: false, price: 0 },
      });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error("GET pricing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/external-comics/:slug/owner
 * Get the owner (sync user) and translator information of the comic.
 */
async function getOwner(req, res) {
  try {
    const { slug } = req.params;
    const row = await ExternalComicModel.getOwner(slug);

    if (!row) {
      return res.json({ data: { comic_id: null, owner_user_id: null, username: null } });
    }

    return res.json({ data: row });
  } catch (err) {
    console.error("GET owner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { list, updateTranslator, getPricing, getOwner };
