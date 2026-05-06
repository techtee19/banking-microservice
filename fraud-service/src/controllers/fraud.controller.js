const FraudLog = require("../models/fraudLog.model");
const Blacklist = require("../models/blacklist.model");
const { evaluateTransaction } = require("../rules/fraudRules");
const { successResponse, errorResponse } = require("../utils/response.utils");

// ─── CHECK TRANSACTION (called by Transaction Service) ─────────
exports.checkTransaction = async (req, res) => {
  try {
    const transactionData = req.body;

    // Run all fraud rules
    const { score, isFraudulent, reasons, triggeredRules } =
      await evaluateTransaction(transactionData);

    // Log every check regardless of outcome
    await FraudLog.create({
      transactionRef: transactionData.transactionRef,
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      sourceAccount: transactionData.sourceAccount,
      destinationAccount: transactionData.destinationAccount,
      score,
      isFraudulent,
      reasons,
      triggeredRules,
    });

    return successResponse(res, 200, "Fraud check complete", {
      isFraudulent,
      score,
      reasons,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET FRAUD LOGS (admin) ────────────────────────────────────
exports.getFraudLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, isFraudulent, userId } = req.query;

    const query = {};
    if (isFraudulent !== undefined)
      query.isFraudulent = isFraudulent === "true";
    if (userId) query.userId = userId;

    const total = await FraudLog.countDocuments(query);
    const logs = await FraudLog.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Fraud logs fetched", {
      logs,
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

// ─── GET FRAUD LOG BY TRANSACTION REF (admin) ──────────────────
exports.getFraudLogByRef = async (req, res) => {
  try {
    const log = await FraudLog.findOne({
      transactionRef: req.params.transactionRef,
    });

    if (!log) return errorResponse(res, 404, "Fraud log not found");

    return successResponse(res, 200, "Fraud log fetched", { log });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADD TO BLACKLIST (admin) ──────────────────────────────────
exports.addToBlacklist = async (req, res) => {
  try {
    const { type, value, reason } = req.body;

    const existing = await Blacklist.findOne({ type, value });
    if (existing) return errorResponse(res, 409, "Already blacklisted");

    const entry = await Blacklist.create({
      type,
      value,
      reason,
      addedBy: req.user.userId,
    });

    return successResponse(res, 201, "Added to blacklist", { entry });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── REMOVE FROM BLACKLIST (admin) ────────────────────────────
exports.removeFromBlacklist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Blacklist.findByIdAndDelete(id);
    if (!entry) return errorResponse(res, 404, "Blacklist entry not found");

    return successResponse(res, 200, "Removed from blacklist");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET BLACKLIST (admin) ─────────────────────────────────────
exports.getBlacklist = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const entries = await Blacklist.find(query).sort({ createdAt: -1 });

    return successResponse(res, 200, "Blacklist fetched", { entries });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
