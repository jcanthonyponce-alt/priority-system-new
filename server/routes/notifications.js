const express = require("express");
const { authRequired } = require("../middleware");
const { listFor, markAllRead } = require("../notify");

const router = express.Router();
router.use(authRequired);

router.get("/", (req, res) => {
  const list = listFor(req.user.id);
  res.json({ notifications: list, unread: list.filter((n) => !n.read).length });
});

router.post("/read", (req, res) => {
  markAllRead(req.user.id);
  res.json({ message: "All marked as read" });
});

module.exports = router;