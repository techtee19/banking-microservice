const axios = require("axios");

const internalRequest = (userId = "", role = "admin") =>
  axios.create({
    headers: {
      "x-internal-api-key": process.env.INTERNAL_API_KEY,
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-email": "",
      "x-user-role": role,
    },
    timeout: 10000,
  });

// ─── Account Service calls ─────────────────────────────────────
const getAccount = async (accountNumber, userId, role = "customer") => {
  const res = await internalRequest(userId, role).get(
    `${process.env.ACCOUNT_SERVICE_URL}/api/accounts/${accountNumber}`,
  );
  return res.data.data.account;
};

const updateBalance = async (accountNumber, amount, operation, userId = "") => {
  const res = await internalRequest(userId).patch(
    `${process.env.ACCOUNT_SERVICE_URL}/api/accounts/${accountNumber}/balance`,
    { amount, operation },
  );
  return res.data.data;
};

// ─── Fraud Detection Service calls ────────────────────────────
const checkFraud = async (transactionData) => {
  const res = await internalRequest().post(
    `${process.env.FRAUD_SERVICE_URL}/api/fraud/check`,
    transactionData,
  );
  return res.data.data;
};

// ─── Notification Service calls ───────────────────────────────
const sendNotification = async (notificationData) => {
  await internalRequest().post(
    `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
    notificationData,
  );
};

module.exports = { getAccount, updateBalance, checkFraud, sendNotification };
