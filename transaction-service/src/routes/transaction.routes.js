const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const {
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const idempotency = require("../middleware/idempotency.middleware");

router.use(authMiddleware);

// ─── Customer routes — idempotency required on all money-moving actions ─
router.post(
  "/transfer",
  idempotency(),
  validate("transfer"),
  transactionController.transfer,
);
router.post(
  "/deposit",
  idempotency(),
  validate("deposit"),
  transactionController.deposit,
);
router.post(
  "/withdrawal",
  idempotency(),
  validate("withdrawal"),
  transactionController.withdrawal,
);

router.get("/my", transactionController.getMyTransactions);
router.get("/:transactionRef", transactionController.getTransactionByRef);

// ─── Admin routes ──────────────────────────────────────────────
router.get("/", requireRole("admin"), transactionController.getAllTransactions);

module.exports = router;
