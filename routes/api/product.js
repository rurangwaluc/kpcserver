const express = require("express");
const router = express.Router();

const {
    create,
    productById,
    read,
    remove,
    update,
    list,
    listRelated,
    listCategories,
    listBySearch,
    photo,
    listSearch
} = require("../../controllers/product");
const {
    requireSignin,
    isAuth,
    isAdmin
} = require("../../controllers/auth");
const {
    userById
} = require("../../controllers/user");
 

router.get("/", list);
router.get("/search", listSearch);
router.post("/by/search", listBySearch);
router.get("/categories", listCategories);
router.get("/:productId", read);
router.post("/create/:userId", requireSignin, isAuth, isAdmin, create);
router.delete("/:productId/:userId", requireSignin, isAuth, isAdmin, remove);
router.put("/update/:productId/:userId", requireSignin, isAuth, isAdmin, update);
router.get("/related/:productId", listRelated);
router.get("/photo/:productId", photo);



router.param("userId", userById);
router.param("productId", productById);

module.exports = router;