const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const AdminExternalComicController = require("../controllers/comics/adminExternalComic.controller");

// Synchronize stories from otruyenapi.com to the database (run a full database transaction)
router.post("/external-comics/sync",
  auth, requireAdmin,
  AdminExternalComicController.sync
);

// Update pricing settings for external comics (free / paid)
router.patch("/external-comics/:apiId/pricing",
  auth, requireAdmin,
  AdminExternalComicController.updatePricing
);

module.exports = router;
