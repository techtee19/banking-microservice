const axios = require("axios");

// console.log("[REGISTRY DEBUG]", {
//   REGISTRY_URL: process.env.REGISTRY_SERVICE_URL,
//   SERVICE_NAME: process.env.SERVICE_NAME,
//   SERVICE_URL: process.env.SERVICE_SELF_URL,
// });

const REGISTRY_URL = process.env.REGISTRY_SERVICE_URL;
const SERVICE_NAME = process.env.SERVICE_NAME;
const SERVICE_URL = process.env.SERVICE_SELF_URL;

const registerWithRegistry = async () => {
  if (!REGISTRY_URL || !SERVICE_NAME || !SERVICE_URL) {
    console.warn(
      "[REGISTRY CLIENT] Missing config — skipping self-registration",
    );
    return;
  }

  try {
    await axios.post(`${REGISTRY_URL}/api/registry/register`, {
      name: SERVICE_NAME,
      url: SERVICE_URL,
    });
    console.log(`[REGISTRY CLIENT] Registered ${SERVICE_NAME} with registry`);
  } catch (err) {
    console.error(`[REGISTRY CLIENT] Failed to register: ${err.message}`);
  }
};

const startHeartbeat = () => {
  if (!REGISTRY_URL || !SERVICE_NAME) return;

  setInterval(async () => {
    try {
      await axios.post(`${REGISTRY_URL}/api/registry/heartbeat`, {
        name: SERVICE_NAME,
      });
    } catch (err) {
      console.error(`[REGISTRY CLIENT] Heartbeat failed: ${err.message}`);
    }
  }, 10000);
};

module.exports = { registerWithRegistry, startHeartbeat };
