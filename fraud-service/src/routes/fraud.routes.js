const express = require("express");
const router = express.Router();
const fraudController = require("../controllers/fraud.controller");
const {
  internalAuth,
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

// ─── Internal route (Transaction Service only) ─────────────────
router.post(
  "/check",
  internalAuth,
  validate("checkFraud"),
  fraudController.checkTransaction,
);

// ─── Admin routes (via API Gateway) ───────────────────────────
router.get(
  "/logs",
  authMiddleware,
  requireRole("admin"),
  fraudController.getFraudLogs,
);
router.get(
  "/logs/:transactionRef",
  authMiddleware,
  requireRole("admin"),
  fraudController.getFraudLogByRef,
);
router.get(
  "/blacklist",
  authMiddleware,
  requireRole("admin"),
  fraudController.getBlacklist,
);
router.post(
  "/blacklist",
  authMiddleware,
  requireRole("admin"),
  validate("addBlacklist"),
  fraudController.addToBlacklist,
);
router.delete(
  "/blacklist/:id",
  authMiddleware,
  requireRole("admin"),
  fraudController.removeFromBlacklist,
);

module.exports = router;
