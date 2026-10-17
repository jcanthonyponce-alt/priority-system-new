const PriorityQueue = require("./structures/PriorityQueue");
const Stack = require("./structures/Stack");

const pq = new PriorityQueue();
pq.enqueue({ title: "Buy milk", priority: 1 });
pq.enqueue({ title: "Finish DSA project", priority: 5 });
pq.enqueue({ title: "Reply to email", priority: 3 });

console.log("Priority queue order:");
while (!pq.isEmpty()) {
  const t = pq.dequeue();
  console.log("-", t.title, "(priority " + t.priority + ")");
}

const archive = new Stack();
archive.push("Deleted task A");
archive.push("Deleted task B");
console.log("Last deleted:", archive.pop());

const Queue = require("./structures/Queue");
const HashMap = require("./structures/HashMap");

const notifications = new Queue();
notifications.enqueue("Task due tomorrow");
notifications.enqueue("New task assigned");
console.log("First notification:", notifications.dequeue());

const users = new HashMap();
users.set("alice", { role: "admin" });
users.set("maria", { role: "user" });
console.log("Find maria:", users.get("maria"));
console.log("Has bob?", users.has("bob"));