const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const {
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

// All routes require authentication
router.use(authMiddleware);

// ─── Customer routes (own profile) ────────────────────────────
router.post(
  "/profile",
  validate("createCustomer"),
  customerController.createProfile,
);
router.get("/profile/me", customerController.getMyProfile);
router.put(
  "/profile/me",
  validate("updateCustomer"),
  customerController.updateMyProfile,
);
router.delete("/profile/me", customerController.deleteMyProfile);

// ─── Admin only routes ─────────────────────────────────────────
router.get("/", requireRole("admin"), customerController.getAllCustomers);
router.get(
  "/:userId",
  requireRole("admin"),
  customerController.getCustomerById,
);

module.exports = router;
