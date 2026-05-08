const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionRef: { type: String, required: true, unique: true }, // Unique reference
    userId: { type: String, required: true }, // Initiator
    type: {
      type: String,
      enum: ["transfer", "deposit", "withdrawal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "flagged", "reversed"],
      default: "pending",
    },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "USD" },
    sourceAccount: { type: String }, // Account number
    destinationAccount: { type: String },
    description: { type: String, trim: true },
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      fraudScore: { type: Number }, // Score from Fraud Detection Service
      failureReason: { type: String }, // If transaction failed
    },
  },
  { timestamps: true },
);

// Indexes for fast querying
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ sourceAccount: 1 });
transactionSchema.index({ destinationAccount: 1 });
// transactionSchema.index({ transactionRef: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
