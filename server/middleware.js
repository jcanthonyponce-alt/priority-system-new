const jwt = require("jsonwebtoken");
const { db } = require("./store");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in" });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Session expired, please log in again" });
  }

  // read the user's CURRENT details, so role changes and deleted accounts take effect at once
  const user = db.users.find((u) => u.id === payload.id);
  if (!user) return res.status(401).json({ error: "Account no longer exists" });

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function adminRequired(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admins only" });
  }
  next();
}

module.exports = { JWT_SECRET, authRequired, adminRequired };