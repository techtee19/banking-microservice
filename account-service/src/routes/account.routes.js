const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account.controller");
const {
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

router.use(authMiddleware);

// ─── Customer routes ───────────────────────────────────────────
router.post("/", validate("createAccount"), accountController.createAccount);
router.get("/my", accountController.getMyAccounts);
router.get("/:accountNumber", accountController.getAccountByNumber);
router.put(
  "/:accountNumber",
  validate("updateAccount"),
  accountController.updateAccount,
);
router.post("/:accountNumber/close", accountController.closeAccount);

// ─── Internal route (called by Transaction Service) ────────────
router.patch(
  "/:accountNumber/balance",
  validate("updateBalance"),
  accountController.updateBalance,
);

// ─── Admin routes ──────────────────────────────────────────────
router.get("/", requireRole("admin"), accountController.getAllAccounts);
router.post(
  "/:accountNumber/freeze",
  requireRole("admin"),
  accountController.toggleFreezeAccount,
);

module.exports = router;
