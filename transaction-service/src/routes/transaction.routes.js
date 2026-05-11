const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const {
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

router.use(authMiddleware);

// ─── Customer routes ───────────────────────────────────────────
router.post("/transfer", validate("transfer"), transactionController.transfer);
router.post("/deposit", validate("deposit"), transactionController.deposit);
router.post(
  "/withdrawal",
  validate("withdrawal"),
  transactionController.withdrawal,
);
router.get("/my", transactionController.getMyTransactions);

// ─── Must come AFTER /my ───────────────────────────────────────
router.get("/:transactionRef", transactionController.getTransactionByRef);

// ─── Admin routes ──────────────────────────────────────────────
router.get("/", requireRole("admin"), transactionController.getAllTransactions);

module.exports = router;
