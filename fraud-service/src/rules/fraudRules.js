const FraudLog = require("../models/fraudLog.model");
const Blacklist = require("../models/blackList.model");

// Each rule returns { score, reason } if triggered, or null if clean
const rules = [
  // ─── Rule 1: High amount transaction ──────────────────────────
  {
    name: "HIGH_AMOUNT",
    check: async ({ amount }) => {
      const threshold = Number(process.env.HIGH_AMOUNT_THRESHOLD) || 10000;
      if (amount >= threshold) {
        return {
          score: 40,
          reason: `Transaction amount $${amount} exceeds high-risk threshold of $${threshold}`,
        };
      }
      return null;
    },
  },

  // ─── Rule 2: Velocity check — too many transactions in 1 hour ──
  {
    name: "HIGH_VELOCITY",
    check: async ({ userId }) => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await FraudLog.countDocuments({
        userId,
        createdAt: { $gte: oneHourAgo },
      });

      const maxPerHour = Number(process.env.MAX_TRANSACTIONS_PER_HOUR) || 10;
      if (count >= maxPerHour) {
        return {
          score: 35,
          reason: `User made ${count} transactions in the last hour (max: ${maxPerHour})`,
        };
      }
      return null;
    },
  },

  // ─── Rule 3: Blacklisted user ──────────────────────────────────
  {
    name: "BLACKLISTED_USER",
    check: async ({ userId }) => {
      const entry = await Blacklist.findOne({ type: "userId", value: userId });
      if (entry) {
        return {
          score: 100,
          reason: `User is blacklisted: ${entry.reason}`,
        };
      }
      return null;
    },
  },

  // ─── Rule 4: Blacklisted account ──────────────────────────────
  {
    name: "BLACKLISTED_ACCOUNT",
    check: async ({ sourceAccount, destinationAccount }) => {
      const accounts = [sourceAccount, destinationAccount].filter(Boolean);
      for (const account of accounts) {
        const entry = await Blacklist.findOne({
          type: "accountNumber",
          value: account,
        });
        if (entry) {
          return {
            score: 100,
            reason: `Account ${account} is blacklisted: ${entry.reason}`,
          };
        }
      }
      return null;
    },
  },

  // ─── Rule 5: Round number amounts (common in fraud) ───────────
  {
    name: "ROUND_AMOUNT",
    check: async ({ amount }) => {
      if (amount >= 1000 && amount % 1000 === 0) {
        return {
          score: 15,
          reason: `Suspiciously round amount: $${amount}`,
        };
      }
      return null;
    },
  },

  // ─── Rule 6: Previously flagged user ──────────────────────────
  {
    name: "PREVIOUSLY_FLAGGED",
    check: async ({ userId }) => {
      const flaggedCount = await FraudLog.countDocuments({
        userId,
        isFraudulent: true,
      });
      if (flaggedCount > 0) {
        return {
          score: 25,
          reason: `User has ${flaggedCount} previously flagged transaction(s)`,
        };
      }
      return null;
    },
  },

  // ─── Rule 7: Self-transfer (same source & destination) ────────
  {
    name: "SELF_TRANSFER",
    check: async ({ sourceAccount, destinationAccount }) => {
      if (
        sourceAccount &&
        destinationAccount &&
        sourceAccount === destinationAccount
      ) {
        return {
          score: 60,
          reason: "Source and destination accounts are the same",
        };
      }
      return null;
    },
  },
];

// Run all rules and compute total score
const evaluateTransaction = async (transactionData) => {
  const triggeredRules = [];
  const reasons = [];
  let totalScore = 0;

  for (const rule of rules) {
    try {
      const result = await rule.check(transactionData);
      if (result) {
        triggeredRules.push(rule.name);
        reasons.push(result.reason);
        totalScore += result.score;
      }
    } catch (err) {
      console.error(`Error in rule ${rule.name}:`, err.message);
    }
  }

  // Cap score at 100
  const score = Math.min(totalScore, 100);
  const threshold = Number(process.env.FRAUD_SCORE_THRESHOLD) || 70;
  const isFraudulent = score >= threshold;

  return { score, isFraudulent, reasons, triggeredRules };
};

module.exports = { evaluateTransaction };
