// Central map of all downstream services
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL,
    prefix: "/api/auth",
    requiresAuth: false,
  },
  customer: {
    url: process.env.CUSTOMER_SERVICE_URL,
    prefix: "/api/customers",
    requiresAuth: true,
  },
  account: {
    url: process.env.ACCOUNT_SERVICE_URL,
    prefix: "/api/accounts",
    requiresAuth: true,
  },
  transaction: {
    url: process.env.TRANSACTION_SERVICE_URL,
    prefix: "/api/transactions",
    requiresAuth: true,
  },
  fraud: {
    url: process.env.FRAUD_SERVICE_URL,
    prefix: "/api/fraud",
    requiresAuth: true,
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL,
    prefix: "/api/notifications",
    requiresAuth: true,
  },
};

module.exports = services;
