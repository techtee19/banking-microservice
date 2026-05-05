const Account = require("../models/account.model");
const {
  generateAccountNumber,
  checkDailyLimit,
} = require("../utils/account.utils");
const { successResponse, errorResponse } = require("../utils/response.utils");

// ─── CREATE ACCOUNT ────────────────────────────────────────────
exports.createAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { accountType, currency, dailyLimit, isPrimary } = req.body;

    // If this is set as primary, unset all other primary accounts
    if (isPrimary) {
      await Account.updateMany({ userId }, { $set: { isPrimary: false } });
    }

    // If it's the user's first account, make it primary automatically
    const accountCount = await Account.countDocuments({ userId });
    const shouldBePrimary = isPrimary || accountCount === 0;

    const account = await Account.create({
      userId,
      accountNumber: generateAccountNumber(),
      accountType,
      currency: currency || "USD",
      dailyLimit: dailyLimit || 5000,
      isPrimary: shouldBePrimary,
    });

    return successResponse(res, 201, "Account created successfully", {
      account,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET MY ACCOUNTS ───────────────────────────────────────────
exports.getMyAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      userId: req.user.userId,
      status: { $ne: "closed" },
    }).sort({ isPrimary: -1, createdAt: -1 }); // Primary account first

    return successResponse(res, 200, "Accounts fetched", { accounts });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET ACCOUNT BY NUMBER ─────────────────────────────────────
exports.getAccountByNumber = async (req, res) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
    });

    if (!account) return errorResponse(res, 404, "Account not found");

    // Customers can only view their own accounts
    if (req.user.role !== "admin" && account.userId !== req.user.userId) {
      return errorResponse(res, 403, "Forbidden — not your account");
    }

    return successResponse(res, 200, "Account fetched", { account });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── UPDATE ACCOUNT ────────────────────────────────────────────
exports.updateAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { isPrimary, dailyLimit } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) return errorResponse(res, 404, "Account not found");

    // Customers can only update their own accounts
    if (req.user.role !== "admin" && account.userId !== req.user.userId) {
      return errorResponse(res, 403, "Forbidden — not your account");
    }

    // If setting as primary, unset others
    if (isPrimary) {
      await Account.updateMany(
        { userId: account.userId },
        { $set: { isPrimary: false } },
      );
    }

    const updated = await Account.findOneAndUpdate(
      { accountNumber },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    return successResponse(res, 200, "Account updated", { account: updated });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── UPDATE BALANCE (internal — called by Transaction Service) ─
exports.updateBalance = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { amount, operation } = req.body;

    const account = await Account.findOne({ accountNumber, status: "active" });
    if (!account)
      return errorResponse(res, 404, "Account not found or inactive");

    if (operation === "debit") {
      // Check sufficient balance
      if (account.balance < amount) {
        return errorResponse(res, 400, "Insufficient balance");
      }

      // Check daily limit
      if (checkDailyLimit(account, amount)) {
        return errorResponse(res, 400, "Daily transaction limit exceeded");
      }

      account.balance -= amount;
      account.dailySpent += amount;
    } else {
      account.balance += amount; // Credit
    }

    await account.save();

    return successResponse(res, 200, "Balance updated", {
      accountNumber: account.accountNumber,
      balance: account.balance,
      operation,
      amount,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── FREEZE / UNFREEZE ACCOUNT ─────────────────────────────────
exports.toggleFreezeAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
    });

    if (!account) return errorResponse(res, 404, "Account not found");

    const newStatus = account.status === "frozen" ? "active" : "frozen";
    account.status = newStatus;
    await account.save();

    return successResponse(res, 200, `Account ${newStatus}`, { account });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── CLOSE ACCOUNT ─────────────────────────────────────────────
exports.closeAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
      userId: req.user.userId,
    });

    if (!account) return errorResponse(res, 404, "Account not found");

    if (account.balance > 0) {
      return errorResponse(
        res,
        400,
        "Cannot close account with remaining balance. Please withdraw first.",
      );
    }

    account.status = "closed";
    await account.save();

    return successResponse(res, 200, "Account closed successfully");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: GET ALL ACCOUNTS ───────────────────────────────────
exports.getAllAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, accountType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (accountType) query.accountType = accountType;

    const total = await Account.countDocuments(query);
    const accounts = await Account.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Accounts fetched", {
      accounts,
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
