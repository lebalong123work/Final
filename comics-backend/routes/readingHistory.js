const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const ReadingHistoryController = require("../controllers/interactions/readingHistory.controller");

router.post("/mark",                          auth, ReadingHistoryController.mark);
router.get("/comic/:comicType/:comicId",      auth, ReadingHistoryController.getByComic);
router.get("/stats",                          auth, ReadingHistoryController.getStats);
router.get("/library",                        auth, ReadingHistoryController.getLibrary);
router.get("/top-comics",                           ReadingHistoryController.getTopComics);

module.exports = router;
