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
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/logs", fraudController.getFraudLogs);
router.get("/logs/:transactionRef", fraudController.getFraudLogByRef);
router.get("/blacklist", fraudController.getBlacklist);
router.post(
  "/blacklist",
  validate("addBlacklist"),
  fraudController.addToBlacklist,
);
router.delete("/blacklist/:id", fraudController.removeFromBlacklist);

module.exports = router;
