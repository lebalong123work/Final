const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const SelfChapterController = require("../controllers/comics/selfChapter.controller");

// Get a list of chapters for a specific story (public)
router.get("/comic/:comicId", SelfChapterController.getByComic);

// Get details of a single chapter including HTML content (public)
router.get("/:id",            SelfChapterController.getById);

// Create a new chapter (upload base64 image → Cloudinary in the model)
router.post("/",    auth, requireAdmin, SelfChapterController.create);

// Update chapter title and content
router.patch("/:id", auth, requireAdmin, SelfChapterController.update);

// Delete chapter
router.delete("/:id", auth, requireAdmin, SelfChapterController.remove);

module.exports = router;
