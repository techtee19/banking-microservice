// In-memory registry: { serviceName: { url, healthPath, status, lastHeartbeat } }
const registry = new Map();

const HEARTBEAT_TIMEOUT_MS = Number(process.env.HEARTBEAT_TIMEOUT_MS) || 30000;

const registerService = (name, url, healthPath = "/health") => {
  registry.set(name, {
    name,
    url,
    healthPath,
    status: "up",
    registeredAt: registry.has(name)
      ? registry.get(name).registeredAt
      : new Date(),
    lastHeartbeat: new Date(),
  });
  return registry.get(name);
};

const heartbeat = (name) => {
  const service = registry.get(name);
  if (!service) return null;
  service.status = "up";
  service.lastHeartbeat = new Date();
  return service;
};

const deregisterService = (name) => {
  return registry.delete(name);
};

const getService = (name) => registry.get(name) || null;

const getAllServices = () => Array.from(registry.values());

// Runs periodically — flags any service that hasn't sent a heartbeat in time
const sweepStaleServices = () => {
  const now = Date.now();
  for (const service of registry.values()) {
    const elapsed = now - new Date(service.lastHeartbeat).getTime();
    if (elapsed > HEARTBEAT_TIMEOUT_MS && service.status !== "down") {
      service.status = "down";
      console.warn(
        `[REGISTRY] Service marked DOWN: ${service.name} (no heartbeat for ${Math.round(elapsed / 1000)}s)`,
      );
    }
  }
};

module.exports = {
  registerService,
  heartbeat,
  deregisterService,
  getService,
  getAllServices,
  sweepStaleServices,
};
