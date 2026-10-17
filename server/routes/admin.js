const express = require("express");
const { db, save } = require("../store");
const { authRequired, adminRequired } = require("../middleware");
const authRouter = require("./auth");
const tasksRouter = require("./tasks");

const router = express.Router();
router.use(authRequired, adminRequired);

router.get("/overview", (req, res) => {
  res.json({
    users: db.users.filter((u) => u.role === "user").length,
    tasks: db.tasks.length,
    completed: db.tasks.filter((t) => t.status === "completed").length,
    archived: db.archive.length,
  });
});

router.get("/users", (req, res) => {
  const users = db.users.map((u) => {
    const mine = db.tasks.filter((t) => t.userId === u.id);
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      taskCount: mine.length,
      completedCount: mine.filter((t) => t.status === "completed").length,
    };
  });
  res.json({ users });
});

// Deleting a user moves all their tasks to the archive
router.delete("/users/:id", (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.role === "admin") {
    return res.status(400).json({ error: "Admin accounts cannot be deleted" });
  }

  const now = new Date().toISOString();
  db.tasks
    .filter((t) => t.userId === user.id)
    .forEach((t) => {
      const archived = { ...t, deletedAt: now };
      db.archive.push(archived);
      tasksRouter.archiveStack.push(archived);
      tasksRouter.tasksById.delete(t.id);
    });

  db.tasks = db.tasks.filter((t) => t.userId !== user.id);
  db.users = db.users.filter((u) => u.id !== user.id);
  authRouter.usersByName.delete(user.username.toLowerCase());
  save();
  res.json({ message: "User deleted and their tasks moved to the archive" });
});

module.exports = router;