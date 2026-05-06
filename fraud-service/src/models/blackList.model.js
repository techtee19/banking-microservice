const mongoose = require("mongoose");

// Blacklisted users or accounts that are permanently blocked
const blacklistSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["userId", "accountNumber"], required: true },
    value: { type: String, required: true },
    reason: { type: String, required: true },
    addedBy: { type: String, required: true }, // Admin userId
  },
  { timestamps: true },
);

blacklistSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("Blacklist", blacklistSchema);
