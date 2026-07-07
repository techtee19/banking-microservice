const axios = require("axios");

const REGISTRY_URL = process.env.REGISTRY_SERVICE_URL;

// Cache resolved URLs briefly to avoid hitting the registry on every request
const cache = new Map();
const CACHE_TTL_MS = 5000;

const resolveServiceUrl = async (serviceName, fallbackUrl) => {
  const cached = cache.get(serviceName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url;
  }

  if (!REGISTRY_URL) return fallbackUrl;

  try {
    const res = await axios.get(
      `${REGISTRY_URL}/api/registry/services/${serviceName}`,
      { timeout: 2000 },
    );
    const service = res.data?.data?.service;

    if (service && service.status === "up") {
      cache.set(serviceName, { url: service.url, timestamp: Date.now() });
      return service.url;
    }

    console.warn(
      `[GATEWAY] Registry reports ${serviceName} as down — using fallback URL`,
    );
    return fallbackUrl;
  } catch (err) {
    console.warn(
      `[GATEWAY] Registry lookup failed for ${serviceName} — using fallback URL`,
    );
    return fallbackUrl;
  }
};

module.exports = { resolveServiceUrl };
