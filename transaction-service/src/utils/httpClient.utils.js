const axios = require("axios");

// Reusable internal HTTP client with API key header
const internalRequest = axios.create({
  headers: {
    "x-internal-api-key": process.env.INTERNAL_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 5000, // 5 second timeout
});

// ─── Account Service calls ─────────────────────────────────────
const getAccount = async (accountNumber) => {
  const res = await internalRequest.get(
    `${process.env.ACCOUNT_SERVICE_URL}/api/accounts/${accountNumber}`,
  );
  return res.data.data.account;
};

const updateBalance = async (accountNumber, amount, operation) => {
  const res = await internalRequest.patch(
    `${process.env.ACCOUNT_SERVICE_URL}/api/accounts/${accountNumber}/balance`,
    { amount, operation },
  );
  return res.data.data;
};

// ─── Fraud Detection Service calls ────────────────────────────
const checkFraud = async (transactionData) => {
  const res = await internalRequest.post(
    `${process.env.FRAUD_SERVICE_URL}/api/fraud/check`,
    transactionData,
  );
  return res.data.data; // { isFraudulent, score, reasons }
};

// ─── Notification Service calls ───────────────────────────────
const sendNotification = async (notificationData) => {
  await internalRequest.post(
    `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
    notificationData,
  );
};

module.exports = { getAccount, updateBalance, checkFraud, sendNotification };
