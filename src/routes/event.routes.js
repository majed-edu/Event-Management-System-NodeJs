const express = require("express");
const eventController = require("../controllers/event.controller");

const router = express.Router();

router.get("/dashboard", eventController.requireLogin, eventController.dashboard);
router.get("/events/new", eventController.requireLogin, eventController.showCreate);
router.post("/events", eventController.requireLogin, eventController.create);
router.get("/events/:slug", eventController.showPublic);
router.post("/events/:slug/register", eventController.register);
router.get("/events/:slug/attendees", eventController.requireLogin, eventController.attendees);

module.exports = router;
