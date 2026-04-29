const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const SelfComicController = require("../controllers/comics/selfComic.controller");

// Get a list of self-published (public) stories
router.get("/",     SelfComicController.list);

// Get details of a single story (public — auth optional, pass token if available to check if purchased)
router.get("/:id",  SelfComicController.getById);

// Create a new story (requires login — upload cover image to Cloudinary in the model)
router.post("/",    auth, requireAdmin, SelfComicController.create);

// Update a story (partial update — upload image if there are changes)
router.patch("/:id", auth, requireAdmin, SelfComicController.update);

// Delete a story
router.delete("/:id", auth, requireAdmin, SelfComicController.remove);

module.exports = router;
