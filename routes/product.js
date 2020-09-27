const express = require("express");
const router = express.Router();

const {
    create,
    productById,
    read,
    productPage,
    remove,
    update,
    list,
    getProducts,
    listRelated,
    listCategories,
    listBySearch,
    photo,
    uploadImage,
    listSearch
} = require("../controllers/product");
const {
    requireSignin,
    isAuth,
    isAdmin
} = require("../controllers/auth");
const {
    userById
} = require("../controllers/user");

router.get("/product/products_by_id", productPage);
router.get("/product/:productId", read);
router.post("/product/create", create);
router.get("/getProducts", getProducts);
router.delete(
    "/product/:productId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    remove
);
router.put(
    "/product/:productId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    update
);

router.post("/products/uploadImage", uploadImage);
router.get("/products", list);
router.get("/productBySell", list);
router.get("/products/search", listSearch);
router.get("/products/related/:productId", listRelated);
router.get("/products/categories", listCategories);
router.post("/products/by/search", listBySearch);
router.get("/product/photo/:productId", photo);

router.param("userId", userById);
router.param("productId", productById);

module.exports = router;