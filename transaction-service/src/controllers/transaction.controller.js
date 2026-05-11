const crypto = require("crypto");
const Transaction = require("../models/transaction.model");
const {
  getAccount,
  updateBalance,
  checkFraud,
  sendNotification,
} = require("../utils/httpClient.utils");
const { successResponse, errorResponse } = require("../utils/response.utils");

// Generate unique transaction reference
const generateTransactionRef = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

// ─── TRANSFER ──────────────────────────────────────────────────
exports.transfer = async (req, res) => {
  const { sourceAccount, destinationAccount, amount, currency, description } =
    req.body;
  const { userId, email } = req.user;

  // Create transaction in pending state first
  const transaction = await Transaction.create({
    transactionRef: generateTransactionRef(),
    userId,
    type: "transfer",
    status: "pending",
    amount,
    currency,
    sourceAccount,
    destinationAccount,
    description,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
  });

  try {
    // Step 1 — Verify source account exists and belongs to user
    const source = await getAccount(sourceAccount, userId);
    if (!source || source.userId !== userId) {
      throw { status: 403, message: "Source account not found or not yours" };
    }

    if (source.status !== "active") {
      throw { status: 400, message: `Source account is ${source.status}` };
    }

    // Step 2 — Verify destination account exists
    const destination = await getAccount(destinationAccount);
    if (!destination) {
      throw { status: 404, message: "Destination account not found" };
    }

    if (destination.status !== "active") {
      throw { status: 400, message: "Destination account is not active" };
    }

    // Step 3 — Check with Fraud Detection Service
    const fraudCheck = await checkFraud({
      transactionRef: transaction.transactionRef,
      userId,
      amount,
      sourceAccount,
      destinationAccount,
      type: "transfer",
    });

    transaction.metadata.fraudScore = fraudCheck.score;

    if (fraudCheck.isFraudulent) {
      transaction.status = "flagged";
      transaction.metadata.failureReason = fraudCheck.reasons.join(", ");
      await transaction.save();

      return errorResponse(res, 403, "Transaction flagged as suspicious", {
        reasons: fraudCheck.reasons,
      });
    }

    // Step 4 — Debit source account
    await updateBalance(sourceAccount, amount, "debit");

    // Step 5 — Credit destination account
    await updateBalance(destinationAccount, amount, "credit");

    // Step 6 — Mark transaction as completed
    transaction.status = "completed";
    await transaction.save();

    // Step 7 — Send notification (non-blocking)
    sendNotification({
      userId,
      email,
      type: "transaction_success",
      data: {
        transactionRef: transaction.transactionRef,
        amount,
        currency,
        type: "transfer",
      },
    }).catch((err) => console.error("Notification error:", err.message));

    return successResponse(res, 200, "Transfer successful", { transaction });
  } catch (err) {
    // Mark transaction as failed
    transaction.status = "failed";
    transaction.metadata.failureReason = err.message;
    await transaction.save();

    return errorResponse(res, err.status || 500, err.message);
  }
};

// ─── DEPOSIT ───────────────────────────────────────────────────
exports.deposit = async (req, res) => {
  const { destinationAccount, amount, currency, description } = req.body;
  const { userId, email } = req.user;

  const transaction = await Transaction.create({
    transactionRef: generateTransactionRef(),
    userId,
    type: "deposit",
    status: "pending",
    amount,
    currency,
    destinationAccount,
    description,
    metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] },
  });

  try {
    // Pass userId so account service can verify ownership
    const destination = await getAccount(destinationAccount, userId);
    if (!destination || destination.userId !== userId) {
      throw { status: 403, message: "Account not found or not yours" };
    }

    if (destination.status !== "active") {
      throw { status: 400, message: `Account is ${destination.status}` };
    }

    await updateBalance(destinationAccount, amount, "credit");

    transaction.status = "completed";
    await transaction.save();

    sendNotification({
      userId,
      email,
      type: "transaction_success",
      data: {
        transactionRef: transaction.transactionRef,
        amount,
        currency,
        type: "deposit",
      },
    }).catch((err) => console.error("Notification error:", err.message));

    return successResponse(res, 200, "Deposit successful", { transaction });
  } catch (err) {
    transaction.status = "failed";
    transaction.metadata.failureReason = err.message;
    await transaction.save();
    return errorResponse(res, err.status || 500, err.message);
  }
};

// ─── WITHDRAWAL ────────────────────────────────────────────────
exports.withdrawal = async (req, res) => {
  const { sourceAccount, amount, currency, description } = req.body;
  const { userId, email } = req.user;

  const transaction = await Transaction.create({
    transactionRef: generateTransactionRef(),
    userId,
    type: "withdrawal",
    status: "pending",
    amount,
    currency,
    sourceAccount,
    description,
    metadata: { ipAddress: req.ip, userAgent: req.headers["user-agent"] },
  });

  try {
    const source = await getAccount(sourceAccount, userId);
    if (!source || source.userId !== userId) {
      throw { status: 403, message: "Account not found or not yours" };
    }

    if (source.status !== "active") {
      throw { status: 400, message: `Account is ${source.status}` };
    }

    // Fraud check for withdrawals too
    const fraudCheck = await checkFraud({
      transactionRef: transaction.transactionRef,
      userId,
      amount,
      sourceAccount,
      type: "withdrawal",
    });

    transaction.metadata.fraudScore = fraudCheck.score;

    if (fraudCheck.isFraudulent) {
      transaction.status = "flagged";
      transaction.metadata.failureReason = fraudCheck.reasons.join(", ");
      await transaction.save();
      return errorResponse(res, 403, "Transaction flagged as suspicious", {
        reasons: fraudCheck.reasons,
      });
    }

    await updateBalance(sourceAccount, amount, "debit");

    transaction.status = "completed";
    await transaction.save();

    sendNotification({
      userId,
      email,
      type: "transaction_success",
      data: {
        transactionRef: transaction.transactionRef,
        amount,
        currency,
        type: "withdrawal",
      },
    }).catch((err) => console.error("Notification error:", err.message));

    return successResponse(res, 200, "Withdrawal successful", { transaction });
  } catch (err) {
    transaction.status = "failed";
    transaction.metadata.failureReason = err.message;
    await transaction.save();

    return errorResponse(res, err.status || 500, err.message);
  }
};

// ─── GET MY TRANSACTIONS ───────────────────────────────────────
exports.getMyTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const query = { userId: req.user.userId };
    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Transactions fetched", {
      transactions,
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

// ─── GET TRANSACTION BY REF ────────────────────────────────────
exports.getTransactionByRef = async (req, res) => {
  try {
    console.log("[GET TX] ref:", req.params.transactionRef);
    console.log("[GET TX] userId:", req.user.userId);

    const transaction = await Transaction.findOne({
      transactionRef: req.params.transactionRef,
    });

    console.log("[GET TX] found:", transaction);

    if (!transaction) return errorResponse(res, 404, "Transaction not found");

    if (req.user.role !== "admin" && transaction.userId !== req.user.userId) {
      return errorResponse(res, 403, "Forbidden — not your transaction");
    }

    return successResponse(res, 200, "Transaction fetched", { transaction });
  } catch (err) {
    console.error("[GET TX ERROR]", err.message);
    return errorResponse(res, 500, err.message);
  }
};
// ─── ADMIN: GET ALL TRANSACTIONS ───────────────────────────────
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, userId } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Transactions fetched", {
      transactions,
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
