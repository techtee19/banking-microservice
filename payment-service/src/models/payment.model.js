const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentRef: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    sourceAccount: { type: String, required: true },

    type: {
      type: String,
      enum: ["card_payment", "bill_payment", "merchant_payment"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "declined"],
      default: "pending",
    },

    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "USD" },

    // Details about the payment destination (biller, merchant, card)
    payee: {
      name: { type: String },
      provider: { type: String }, // e.g. "Visa", "DSTV", "PHCN"
      reference: { type: String }, // biller account number / merchant id
    },

    // Simulated response from the external payment gateway
    gatewayResponse: {
      provider: { type: String, default: "MockPay" },
      providerReference: { type: String },
      responseCode: { type: String },
      message: { type: String },
    },

    description: { type: String, trim: true },

    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      failureReason: { type: String },
    },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ paymentRef: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
