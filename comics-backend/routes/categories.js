const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const CategoryController = require("../controllers/comics/category.controller");

router.get("/",           CategoryController.list);
router.get("/:id",        CategoryController.getById);
router.post("/ensure",    auth, CategoryController.ensure);
router.post("/",          auth, requireAdmin, CategoryController.create);
router.put("/:id",        auth, requireAdmin, CategoryController.update);
router.delete("/:id",     auth, requireAdmin, CategoryController.remove);

module.exports = router;
