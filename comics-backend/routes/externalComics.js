const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const ExternalComicController = require("../controllers/comics/externalComic.controller");

// List of external (public) stories — support ?q=&category=&page=&limit=
router.get("/",                      ExternalComicController.list);

// Update translator (owner or admin/sub_admin)
router.put("/:slug/translator", auth, ExternalComicController.updateTranslator);

// Get pricing information (public) — return default if not in DB
router.get("/:slug/pricing",         ExternalComicController.getPricing);

// Get owner and translator information (public)
router.get("/:slug/owner",           ExternalComicController.getOwner);

module.exports = router;
