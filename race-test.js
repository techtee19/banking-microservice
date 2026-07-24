const axios = require("axios");
const https = require("https");

// Allow self-signed cert for this test script
const agent = new https.Agent({ rejectUnauthorized: false });

const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTVlNzMxZGY3MmFiMjlkZmFmZmExMTUiLCJlbWFpbCI6ImRhbWlzaWlkcmlzQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzg0NTc1NjkxLCJleHAiOjE3ODQ2NjIwOTF9.O0jnJYQ1czWTMYi7eZCtLSXEzb0cUleUTW-ZSos2VqM";
const ACCOUNT_NUMBER = "ACC559903223964";

const makeWithdrawal = (label) => {
  return axios
    .post(
      "https://localhost:3000/api/transactions/withdrawal",
      {
        sourceAccount: ACCOUNT_NUMBER,
        amount: 100,
        currency: "USD",
        description: `Race condition test - ${label}`,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      },
    )
    .then((res) =>
      console.log(
        `[${label}] SUCCESS:`,
        res.data.message,
        "- new status:",
        res.data.data.transaction.status,
      ),
    )
    .catch((err) =>
      console.log(
        `[${label}] FAILED:`,
        err.response?.data?.message || err.message,
      ),
    );
};

// Fire both requests at literally the same instant
Promise.all([makeWithdrawal("Request A"), makeWithdrawal("Request B")]).then(
  () => {
    console.log("\nBoth requests completed. Check your account balance now.");
  },
);
