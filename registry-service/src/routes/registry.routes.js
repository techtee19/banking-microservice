const express = require("express");
const router = express.Router();
const registryController = require("../controllers/registry.controller");

router.post("/register", registryController.register);
router.post("/heartbeat", registryController.sendHeartbeat);
router.delete("/deregister/:name", registryController.deregister);
router.get("/services", registryController.getAll);
router.get("/services/:name", registryController.getOne);

module.exports = router;
