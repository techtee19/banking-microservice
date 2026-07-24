const crypto = require("crypto");

const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomInt(100000, 999999).toString();
  return `ACC${timestamp}${random}`;
};

module.exports = { generateAccountNumber };
