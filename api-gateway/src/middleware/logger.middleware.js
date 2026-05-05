// Logs every request passing through the gateway
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[GATEWAY] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms) | IP: ${req.ip}`,
    );
  });

  next();
};

module.exports = requestLogger;
