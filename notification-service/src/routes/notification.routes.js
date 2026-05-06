const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const {
  internalAuth,
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

// ─── Internal route (other services only) ─────────────────────
router.post(
  "/send",
  internalAuth,
  validate("sendNotification"),
  notificationController.sendNotification,
);

// ─── Customer routes (via API Gateway) ────────────────────────
router.use(authMiddleware);
router.get("/my", notificationController.getMyNotifications);
router.get("/my/:id", notificationController.getNotificationById);

// ─── Admin routes ──────────────────────────────────────────────
router.get(
  "/",
  requireRole("admin"),
  notificationController.getAllNotifications,
);
router.post(
  "/:id/retry",
  requireRole("admin"),
  notificationController.retryNotification,
);

module.exports = router;
