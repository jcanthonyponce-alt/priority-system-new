const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HashMap = require("../structures/HashMap");
const { db, save } = require("../store");
const { JWT_SECRET, authRequired } = require("../middleware");

const router = express.Router();

// Hash map for fast username lookup
const usersByName = new HashMap();
db.users.forEach((u) => usersByName.set(u.username.toLowerCase(), u));

// Create a default admin the first time the server runs
if (!usersByName.has("admin")) {
  const admin = {
    id: "u_" + Date.now(),
    username: "admin",
    email: "admin@example.com",
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10),
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  db.users.push(admin);
  usersByName.set("admin", admin);
  save();
}

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

const makeToken = (u) =>
  jwt.sign({ id: u.id, username: u.username, role: u.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

const EMAIL_RE = /^\S+@\S+\.\S+$/;

router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const key = username.trim().toLowerCase();
  if (usersByName.has(key)) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const user = {
    id: "u_" + Date.now(),
    username: username.trim(),
    email: email.trim(),
    password: bcrypt.hashSync(password, 10),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  usersByName.set(key, user);
  save();

  res.status(201).json({ token: makeToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = usersByName.get(String(username || "").trim().toLowerCase());

  if (!user || !bcrypt.compareSync(String(password || ""), user.password)) {
    return res.status(401).json({ error: "Wrong username or password" });
  }

  res.json({ token: makeToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, (req, res) => {
  const user = usersByName.get(req.user.username.toLowerCase());
  if (!user) return res.status(401).json({ error: "Account no longer exists" });
  res.json({ user: publicUser(user) });
});

// Update profile (email)
router.put("/me", authRequired, (req, res) => {
  const user = usersByName.get(req.user.username.toLowerCase());
  if (!user) return res.status(401).json({ error: "Account no longer exists" });

  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email" });
  }
  user.email = email.trim();
  save();
  res.json({ user: publicUser(user) });
});

// Change password
router.put("/password", authRequired, (req, res) => {
  const user = usersByName.get(req.user.username.toLowerCase());
  if (!user) return res.status(401).json({ error: "Account no longer exists" });

  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(String(currentPassword || ""), user.password)) {
    return res.status(400).json({ error: "Current password is wrong" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  save();
  res.json({ message: "Password changed" });
});

router.usersByName = usersByName;
module.exports = router;