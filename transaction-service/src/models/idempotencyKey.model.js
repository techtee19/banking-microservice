const mongoose = require("mongoose");

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    requestHash: { type: String, required: true }, // fingerprint of the request body
    status: {
      type: String,
      enum: ["processing", "completed"],
      default: "processing",
    },
    responseStatus: { type: Number },
    responseBody: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Auto-delete idempotency records after 24 hours — no need to keep them forever
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("IdempotencyKey", idempotencyKeySchema);
