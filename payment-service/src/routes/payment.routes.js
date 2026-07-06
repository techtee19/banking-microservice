const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {
  authMiddleware,
  requireRole,
} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

router.use(authMiddleware);

router.post("/", validate("createPayment"), paymentController.initiatePayment);
router.get("/my", paymentController.getMyPayments);
router.get("/:paymentRef", paymentController.getPaymentByRef);

router.get("/", requireRole("admin"), paymentController.getAllPayments);

module.exports = router;
