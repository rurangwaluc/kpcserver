const express = require("express");
const router = express.Router();

const {
  requireSignin,
  isAuth
} = require("../../controllers/auth");
const {
  userById
} = require("../../controllers/user");
const {
  generateToken,
  processPayment
} = require("../../controllers/braintree");

router.get("/getToken/:userId", requireSignin, isAuth, generateToken);
router.post("/payment/:userId", requireSignin, isAuth, processPayment);

router.param("userId", userById);

module.exports = router;