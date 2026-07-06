const crypto = require("crypto");
const Payment = require("../models/payment.model");
const { processPayment } = require("../providers/paymentGateway.provider");
const {
  getAccount,
  updateBalance,
  checkFraud,
  sendNotification,
} = require("../utils/httpClient.utils");
const { successResponse, errorResponse } = require("../utils/response.utils");

const generatePaymentRef = () => {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

// ─── INITIATE PAYMENT ───────────────────────────────────────────
exports.initiatePayment = async (req, res) => {
  const { sourceAccount, type, amount, currency, description, payee } =
    req.body;
  const { userId, email } = req.user;

  const payment = await Payment.create({
    paymentRef: generatePaymentRef(),
    userId,
    sourceAccount,
    type,
    status: "pending",
    amount,
    currency,
    payee,
    description,
    metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] },
  });

  try {
    // Step 1 — Verify the source account belongs to the user and is active
    const account = await getAccount(sourceAccount, userId);
    if (!account || account.userId !== userId) {
      throw { status: 403, message: "Source account not found or not yours" };
    }
    if (account.status !== "active") {
      throw { status: 400, message: `Account is ${account.status}` };
    }

    // Step 2 — Run fraud check before touching external gateway or funds
    const fraudCheck = await checkFraud({
      transactionRef: payment.paymentRef,
      userId,
      amount,
      sourceAccount,
      type: "withdrawal", // payments are treated as outgoing debits for fraud scoring
    });

    if (fraudCheck.isFraudulent) {
      payment.status = "declined";
      payment.metadata.failureReason = fraudCheck.reasons.join(", ");
      await payment.save();
      return errorResponse(res, 403, "Payment flagged as suspicious", {
        reasons: fraudCheck.reasons,
      });
    }

    // Step 3 — Debit the account first (reserve the funds)
    await updateBalance(sourceAccount, amount, "debit", userId);

    // Step 4 — Call the external payment gateway (simulated)
    const gatewayResult = await processPayment({ amount, payee, type });

    payment.gatewayResponse = {
      provider: payee.provider || "MockPay",
      providerReference: gatewayResult.providerReference,
      responseCode: gatewayResult.responseCode,
      message: gatewayResult.message,
    };

    if (!gatewayResult.success) {
      // Gateway declined — refund the account since funds were already reserved
      await updateBalance(sourceAccount, amount, "credit", userId);
      payment.status = "declined";
      payment.metadata.failureReason = gatewayResult.message;
      await payment.save();
      return errorResponse(res, 402, "Payment declined by provider", {
        reason: gatewayResult.message,
      });
    }

    // Step 5 — Mark payment completed
    payment.status = "completed";
    await payment.save();

    // Step 6 — Notify user (non-blocking)
    sendNotification({
      userId,
      email,
      type: "transaction_success",
      data: {
        transactionRef: payment.paymentRef,
        amount,
        currency,
        type: `${type} to ${payee.name}`,
      },
    }).catch((err) => console.error("Notification error:", err.message));

    return successResponse(res, 200, "Payment successful", { payment });
  } catch (err) {
    payment.status = "failed";
    payment.metadata.failureReason = err.message;
    await payment.save();
    return errorResponse(res, err.status || 500, err.message);
  }
};

// ─── GET MY PAYMENTS ────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const query = { userId: req.user.userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Payments fetched", {
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET PAYMENT BY REF ─────────────────────────────────────────
exports.getPaymentByRef = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      paymentRef: req.params.paymentRef,
    });
    if (!payment) return errorResponse(res, 404, "Payment not found");

    if (req.user.role !== "admin" && payment.userId !== req.user.userId) {
      return errorResponse(res, 403, "Forbidden — not your payment");
    }

    return successResponse(res, 200, "Payment fetched", { payment });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: GET ALL PAYMENTS ────────────────────────────────────
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Payments fetched", {
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
