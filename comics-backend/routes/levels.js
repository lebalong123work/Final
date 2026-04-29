const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const LevelController = require("../controllers/auth/level.controller");

router.get("/me-progress", auth,                        LevelController.getMeProgress);
router.get("/",                                          LevelController.list);
router.get("/:id",                                       LevelController.getById);
router.post("/",           auth, requireAdmin,           LevelController.create);
router.put("/:id",         auth, requireAdmin,           LevelController.update);
router.delete("/:id",      auth, requireAdmin,           LevelController.remove);

module.exports = router;
