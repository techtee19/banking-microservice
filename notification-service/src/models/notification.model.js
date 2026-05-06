const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    email: { type: String },
    type: {
      type: String,
      enum: [
        "transaction_success",
        "transaction_failed",
        "transaction_flagged",
        "login_success",
        "login_failed",
        "account_created",
        "account_frozen",
        "password_changed",
      ],
      required: true,
    },
    channel: { type: String, enum: ["email", "sms", "push"], default: "email" },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    subject: { type: String },
    body: { type: String },
    data: { type: mongoose.Schema.Types.Mixed }, // Raw payload from sender
    error: { type: String }, // If sending failed
    sentAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
