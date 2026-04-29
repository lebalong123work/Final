const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const ReactionController = require("../controllers/interactions/reaction.controller");

router.get("/chapter/:chapterId",            ReactionController.getChapterReactions);
router.post("/chapter/:chapterId/toggle",    auth, ReactionController.toggleReaction);
router.get("/comic/:comicType/:comicId",     ReactionController.getComicReactions);
router.get("/my-liked/:comicType/:comicId",  auth, ReactionController.getMyLiked);
router.get("/library",                       auth, ReactionController.getLibrary);
router.get("/top-comics",                         ReactionController.getTopComics);
router.get("/latest-liked",                       ReactionController.getLatestLiked);

module.exports = router;
