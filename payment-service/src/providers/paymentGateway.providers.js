const crypto = require("crypto");

// Simulates calling an external payment gateway (e.g. Visa/Mastercard, Paystack, Flutterwave)
// In a real system this would make an HTTPS call to the provider's API
const processPayment = async ({ amount, payee, type }) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const providerReference = `MOCKPAY-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // Simulate a small percentage of declined payments for realism
  const isDeclined = Math.random() < 0.05; // 5% decline rate

  if (isDeclined) {
    return {
      success: false,
      providerReference,
      responseCode: "51",
      message: "Insufficient funds at issuing bank / declined by provider",
    };
  }

  return {
    success: true,
    providerReference,
    responseCode: "00",
    message: `Payment of ${amount} processed successfully via ${payee?.provider || "MockPay"}`,
  };
};

module.exports = { processPayment };
