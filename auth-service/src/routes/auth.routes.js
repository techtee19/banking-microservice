const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiter");

router.post(
  "/register",
  authLimiter,
  validate("register"),
  authController.register,
);
router.post("/login", authLimiter, validate("login"), authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);

module.exports = router;
