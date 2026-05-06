const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // From Auth Service
    accountNumber: { type: String, required: true, unique: true },
    accountType: {
      type: String,
      enum: ["savings", "checking", "fixed_deposit"],
      required: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["active", "inactive", "frozen", "closed"],
      default: "active",
    },
    dailyLimit: { type: Number, default: 5000 }, // Max daily transaction
    dailySpent: { type: Number, default: 0 }, // Reset every day
    lastLimitReset: { type: Date, default: Date.now },
    isPrimary: { type: Boolean, default: false }, // Primary account flag
  },
  { timestamps: true },
);

// Index for fast lookup by userId
accountSchema.index({ userId: 1 });

module.exports = mongoose.model("Account", accountSchema);
