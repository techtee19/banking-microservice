const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema(
  {
    transactionRef: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    sourceAccount: { type: String },
    destinationAccount: { type: String },
    score: { type: Number, required: true }, // 0-100
    isFraudulent: { type: Boolean, required: true },
    reasons: [{ type: String }], // Rules triggered
    triggeredRules: [{ type: String }], // Rule names
  },
  { timestamps: true },
);

fraudLogSchema.index({ userId: 1, createdAt: -1 });
fraudLogSchema.index({ isFraudulent: 1 });

module.exports = mongoose.model("FraudLog", fraudLogSchema);
