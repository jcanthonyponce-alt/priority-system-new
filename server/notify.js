const { db, save } = require("./store");
const Queue = require("./structures/Queue");
const HashMap = require("./structures/HashMap");

if (!db.notifications) db.notifications = [];

const MAX_PER_USER = 30;

// Hash map: userId -> Queue of that user's notifications (oldest at the front)
const queues = new HashMap();

function queueFor(userId) {
  let q = queues.get(userId);
  if (!q) {
    q = new Queue();
    queues.set(userId, q);
  }
  return q;
}

// load saved notifications into their queues
db.notifications.forEach((n) => queueFor(n.userId).enqueue(n));

function notify(userId, message) {
  const q = queueFor(userId);
  const n = {
    id: "n_" + Date.now() + Math.floor(Math.random() * 1000),
    userId,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  q.enqueue(n);
  db.notifications.push(n);

  // first in, first out: when there are too many, the oldest one is removed
  while (q.size() > MAX_PER_USER) {
    const oldest = q.dequeue();
    db.notifications = db.notifications.filter((x) => x.id !== oldest.id);
  }
  save();
}

// newest first
function listFor(userId) {
  return queueFor(userId).toArray().reverse();
}

function markAllRead(userId) {
  queueFor(userId)
    .toArray()
    .forEach((n) => (n.read = true));
  save();
}

module.exports = { notify, listFor, markAllRead };