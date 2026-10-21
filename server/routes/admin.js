const express = require("express");
const { db, save } = require("../store");
const { authRequired, adminRequired } = require("../middleware");
const { notify } = require("../notify");
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

// Make a user an administrator, or make an administrator a normal user again
router.put("/users/:id/role", (req, res) => {
  const { role } = req.body;
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ error: "Role must be admin or user" });
  }

  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.id === req.user.id) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }
  if (user.role === role) {
    return res.status(400).json({ error: `${user.username} is already ${role === "admin" ? "an admin" : "a normal user"}` });
  }

  user.role = role;
  save();
  notify(
    user.id,
    role === "admin"
      ? "You are now an administrator"
      : "Your administrator access was removed"
  );
  res.json({ user: { id: user.id, username: user.username, role: user.role } });
});

// Deleting a user moves all their tasks to the archive
router.delete("/users/:id", (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.role === "admin") {
    return res.status(400).json({ error: "Admin accounts cannot be deleted. Remove admin access first." });
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