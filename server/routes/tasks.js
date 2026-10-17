const express = require("express");
const { db, save } = require("../store");
const { authRequired } = require("../middleware");
const PriorityQueue = require("../structures/PriorityQueue");
const Stack = require("../structures/Stack");
const HashMap = require("../structures/HashMap");
const { mergeSort } = require("../algorithms/sort");
const { linearSearch } = require("../algorithms/search");
const { notify } = require("../notify");

const router = express.Router();
router.use(authRequired);

const PRIORITY_VALUE = { low: 1, medium: 2, high: 3 };
const STATUSES = ["pending", "in-progress", "completed"];
const CATEGORIES = ["work", "study", "personal", "health", "environment", "general"];

// tasks created before categories existed get the "general" category
db.tasks.forEach((t) => {
  if (!t.category) t.category = "general";
});
db.archive.forEach((t) => {
  if (!t.category) t.category = "general";
});

// Hash map: task id -> task (instant lookup)
const tasksById = new HashMap();
db.tasks.forEach((t) => tasksById.set(t.id, t));

// Stack: archive of deleted tasks (last deleted is on top)
const archiveStack = new Stack();
db.archive.forEach((t) => archiveStack.push(t));

const isAdmin = (user) => user.role === "admin";
const canAccess = (task, user) => isAdmin(user) || task.userId === user.id;
const visibleTasks = (user) =>
  isAdmin(user) ? db.tasks : db.tasks.filter((t) => t.userId === user.id);

const sorters = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
  priority: (a, b) => PRIORITY_VALUE[a.priority] - PRIORITY_VALUE[b.priority],
  deadline: (a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"),
};

function validate(body, isUpdate) {
  const errors = [];
  if (!isUpdate || body.title !== undefined) {
    if (!body.title || body.title.trim().length < 2) {
      errors.push("Title must be at least 2 characters");
    }
  }
  if (body.priority !== undefined && !PRIORITY_VALUE[body.priority]) {
    errors.push("Priority must be low, medium or high");
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push("Status must be pending, in-progress or completed");
  }
  if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
    errors.push("Category is not valid");
  }
  if (body.deadline && isNaN(Date.parse(body.deadline))) {
    errors.push("Deadline must be a valid date");
  }
  return errors;
}

// ---- Special routes (must come before "/:id") ----

router.get("/stats", (req, res) => {
  const list = visibleTasks(req.user);
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    total: list.length,
    pending: list.filter((t) => t.status === "pending").length,
    inProgress: list.filter((t) => t.status === "in-progress").length,
    completed: list.filter((t) => t.status === "completed").length,
    overdue: list.filter(
      (t) => t.status !== "completed" && t.deadline && t.deadline < today
    ).length,
    noDeadline: list.filter((t) => !t.deadline).length,
  });
});

router.get("/recent", (req, res) => {
  const sorted = mergeSort(visibleTasks(req.user), (a, b) =>
    sorters.createdAt(b, a)
  );
  res.json({ tasks: sorted.slice(0, 5) });
});

// "Up next": the 5 most urgent unfinished tasks, taken from a priority queue
router.get("/upnext", (req, res) => {
  const pq = new PriorityQueue((a, b) => {
    const diff = PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority];
    if (diff !== 0) return diff;
    return (a.deadline || "9999").localeCompare(b.deadline || "9999");
  });
  visibleTasks(req.user)
    .filter((t) => t.status !== "completed")
    .forEach((t) => pq.enqueue(t));
  const top = [];
  while (!pq.isEmpty() && top.length < 5) top.push(pq.dequeue());
  res.json({ tasks: top });
});

router.get("/archive", (req, res) => {
  const items = archiveStack.toArray().filter((t) => canAccess(t, req.user));
  res.json({ tasks: items });
});

router.post("/archive/:id/restore", (req, res) => {
  const item = db.archive.find((t) => t.id === req.params.id);
  if (!item || !canAccess(item, req.user)) {
    return res.status(404).json({ error: "Archived task not found" });
  }
  db.archive = db.archive.filter((t) => t.id !== item.id);
  archiveStack.items = [...db.archive];

  const { deletedAt, ...task } = item;
  task.updatedAt = new Date().toISOString();
  db.tasks.push(task);
  tasksById.set(task.id, task);
  save();
  notify(task.userId, `Task "${task.title}" was restored from the archive`);
  res.json({ task });
});

// ---- Normal task routes ----

router.get("/", (req, res) => {
  const { search, status, priority, category, sortBy = "createdAt", order = "desc" } = req.query;
  let list = linearSearch(visibleTasks(req.user), search);
  if (status) list = list.filter((t) => t.status === status);
  if (priority) list = list.filter((t) => t.priority === priority);
  if (category) list = list.filter((t) => t.category === category);

  const compare = sorters[sortBy] || sorters.createdAt;
  list = mergeSort(list, (a, b) => (order === "asc" ? compare(a, b) : compare(b, a)));
  res.json({ tasks: list });
});

router.post("/", (req, res) => {
  const errors = validate(req.body, false);
  if (errors.length) return res.status(400).json({ error: errors[0] });

  const now = new Date().toISOString();
  const task = {
    id: "t_" + Date.now() + Math.floor(Math.random() * 1000),
    userId: req.user.id,
    title: req.body.title.trim(),
    description: (req.body.description || "").trim(),
    priority: req.body.priority || "medium",
    status: req.body.status || "pending",
    category: req.body.category || "general",
    deadline: req.body.deadline || null,
    createdAt: now,
    updatedAt: now,
  };
  db.tasks.push(task);
  tasksById.set(task.id, task);
  save();
  notify(task.userId, `Task "${task.title}" was added`);
  res.status(201).json({ task });
});

router.get("/:id", (req, res) => {
  const task = tasksById.get(req.params.id);
  if (!task || !canAccess(task, req.user)) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ task });
});

router.put("/:id", (req, res) => {
  const task = tasksById.get(req.params.id);
  if (!task || !canAccess(task, req.user)) {
    return res.status(404).json({ error: "Task not found" });
  }
  const errors = validate(req.body, true);
  if (errors.length) return res.status(400).json({ error: errors[0] });

  const oldStatus = task.status;
  for (const field of ["title", "description", "priority", "status", "category", "deadline"]) {
    if (req.body[field] !== undefined) {
      task[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  }
  if (task.deadline === "") task.deadline = null;
  if (oldStatus !== "completed" && task.status === "completed") {
    notify(task.userId, `Task "${task.title}" was completed`);
  }
  task.updatedAt = new Date().toISOString();
  save();
  res.json({ task });
});

// Delete = move the task to the archive (so it can be restored)
router.delete("/:id", (req, res) => {
  const task = tasksById.get(req.params.id);
  if (!task || !canAccess(task, req.user)) {
    return res.status(404).json({ error: "Task not found" });
  }
  db.tasks = db.tasks.filter((t) => t.id !== task.id);
  tasksById.delete(task.id);

  const archived = { ...task, deletedAt: new Date().toISOString() };
  db.archive.push(archived);
  archiveStack.push(archived);
  save();
  notify(task.userId, `Task "${task.title}" was moved to the archive`);
  res.json({ message: "Task moved to archive" });
});

router.tasksById = tasksById;
router.archiveStack = archiveStack;

module.exports = router;