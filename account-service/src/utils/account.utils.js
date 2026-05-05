const crypto = require("crypto");

// Generate a unique account number
const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomInt(100000, 999999).toString();
  return `ACC${timestamp}${random}`;
};

// Check if daily limit will be exceeded
const checkDailyLimit = (account, amount) => {
  const now = new Date();
  const lastReset = new Date(account.lastLimitReset);

  // Reset daily spent if it's a new day
  const isNewDay =
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (isNewDay) {
    account.dailySpent = 0;
    account.lastLimitReset = now;
  }

  return account.dailySpent + amount > account.dailyLimit;
};

module.exports = { generateAccountNumber, checkDailyLimit };
