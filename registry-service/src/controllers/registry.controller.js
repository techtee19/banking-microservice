const {
  registerService,
  heartbeat,
  deregisterService,
  getService,
  getAllServices,
} = require("../store/registry.store");
const { successResponse, errorResponse } = require("../utils/response.utils");

// ─── REGISTER A SERVICE ─────────────────────────────────────────
exports.register = (req, res) => {
  const { name, url, healthPath } = req.body;

  if (!name || !url) {
    return errorResponse(res, 400, "'name' and 'url' are required");
  }

  const service = registerService(name, url, healthPath);
  console.log(`[REGISTRY] Registered: ${name} -> ${url}`);

  return successResponse(res, 201, "Service registered", { service });
};

// ─── HEARTBEAT ───────────────────────────────────────────────────
exports.sendHeartbeat = (req, res) => {
  const { name } = req.body;

  if (!name) {
    return errorResponse(res, 400, "'name' is required");
  }

  const service = heartbeat(name);
  if (!service) {
    return errorResponse(
      res,
      404,
      "Service not registered — call /register first",
    );
  }

  return successResponse(res, 200, "Heartbeat received", { service });
};

// ─── DEREGISTER ──────────────────────────────────────────────────
exports.deregister = (req, res) => {
  const { name } = req.params;
  const removed = deregisterService(name);

  if (!removed) {
    return errorResponse(res, 404, "Service not found");
  }

  console.log(`[REGISTRY] Deregistered: ${name}`);
  return successResponse(res, 200, "Service deregistered");
};

// ─── GET ONE SERVICE ─────────────────────────────────────────────
exports.getOne = (req, res) => {
  const service = getService(req.params.name);
  if (!service) return errorResponse(res, 404, "Service not found");
  return successResponse(res, 200, "Service fetched", { service });
};

// ─── GET ALL SERVICES ────────────────────────────────────────────
exports.getAll = (req, res) => {
  const services = getAllServices();
  return successResponse(res, 200, "Services fetched", { services });
};
