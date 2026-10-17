import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Settings as SettingsIcon,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Donut from "../components/Donut";
import AdminExtras from "../components/AdminExtras";
import { CATEGORIES, CategoryTag } from "../categories";
import { formatDeadline, isOverdue } from "../utils";
import "./dashboard.css";
import "./tasks.css";
import "./admin.css";

const PAGE_SIZE = 8;
const STATUS_LABEL = { pending: "Pending", "in-progress": "In Progress", completed: "Done" };
const ACT_ICON = { user: UserPlus, added: Plus, done: CircleCheck, deleted: Trash2 };

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState([]);
  const [archived, setArchived] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loadedAt, setLoadedAt] = useState(new Date());

  function load() {
    Promise.all([
      api("/tasks?sortBy=deadline&order=asc"),
      api("/admin/users"),
      api("/tasks/archive"),
    ])
      .then(([t, u, a]) => {
        setTasks(t.tasks);
        setUsers(u.users);
        setArchived(a.tasks);
        setLoadedAt(new Date());
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(task) {
    if (!window.confirm(`Move "${task.title}" to the archive?`)) return;
    try {
      await api(`/tasks/${task.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <div className="error">{error}</div>;
  if (!tasks) return <p className="loading">Loading...</p>;

  const nameOf = (id) => users.find((u) => u.id === id)?.username || "Unknown";

  // ---- numbers for the cards and donut ----
  const todo = tasks.filter((t) => t.status !== "completed");
  const countOf = (p) => todo.filter((t) => t.priority === p).length;
  const high = countOf("high");
  const medium = countOf("medium");
  const low = countOf("low");
  const total = high + medium + low;
  const registered = users.filter((u) => u.role === "user").length;

  const cards = [
    { cls: "total", title: "Total Users", count: registered, sub: "Registered users", icon: UsersIcon, to: "/users" },
    { cls: "high", title: "High Priority Tasks", count: high, sub: "Needs attention", icon: CircleAlert, to: "/tasks" },
    { cls: "medium", title: "Medium Priority Tasks", count: medium, sub: "In progress", icon: Clock, to: "/tasks" },
    { cls: "low", title: "Low Priority Tasks", count: low, sub: "On track", icon: CircleCheck, to: "/tasks" },
    { cls: "extra", title: "Total Tasks", count: tasks.length, sub: "All tasks", icon: ListChecks, to: "/tasks" },
  ];

  const legend = [
    { name: "High", value: high, color: "var(--high-main)" },
    { name: "Medium", value: medium, color: "var(--med-main)" },
    { name: "Low", value: low, color: "var(--low-main)" },
  ];

  // ---- manage tasks table: filter + pages ----
  const q = search.trim().toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (!q || t.title.toLowerCase().includes(q)) &&
      (!priority || t.priority === priority) &&
      (!status || t.status === status) &&
      (!category || t.category === category)
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const startIdx = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // ---- recent activity, built from users, tasks and the archive ----
  const events = [];
  users
    .filter((u) => u.role === "user")
    .forEach((u) =>
      events.push({ id: "u" + u.id, kind: "user", time: u.createdAt, text: `${u.username} joined` })
    );
  tasks.forEach((t) => {
    events.push({
      id: "a" + t.id,
      kind: "added",
      time: t.createdAt,
      text: `${nameOf(t.userId)} added "${t.title}"`,
    });
    if (t.status === "completed") {
      events.push({
        id: "c" + t.id,
        kind: "done",
        time: t.updatedAt,
        text: `${nameOf(t.userId)} completed "${t.title}"`,
      });
    }
  });
  archived.forEach((t) =>
    events.push({
      id: "d" + t.id,
      kind: "deleted",
      time: t.deletedAt,
      text: `${nameOf(t.userId)} deleted "${t.title}"`,
    })
  );
  events.sort((a, b) => b.time.localeCompare(a.time));
  const activity = events.slice(0, 6);

  return (
    <div>
      <h1 className="page-title">Welcome back, {user.username}!</h1>
      <p className="muted">Here is an overview of your system and tasks.</p>

      <div className="pcards five">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.cls} to={c.to} className={"pcard " + c.cls}>
              <div className="pcard-head">
                <span className="pcard-icon">
                  <Icon size={18} />
                </span>
                {c.title}
              </div>
              <div className="pcard-num">{c.count}</div>
              <div className="pcard-sub">{c.sub}</div>
              <ChevronRight size={20} className="pcard-arrow" />
            </Link>
          );
        })}
      </div>

      <div className="admin-grid">
        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Manage Tasks</h2>
          </div>

          <div className="admin-tools">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search tasks..."
              />
            </div>
            <select
              className="filter"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              className="filter"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Done</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="atable">
              <thead>
                <tr>
                  <th>Task title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Due date</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  rows.map((t) => {
                    const name = nameOf(t.userId);
                    return (
                      <tr key={t.id}>
                        <td className="cell-title">{t.title}</td>
                        <td>
                          <CategoryTag id={t.category} />
                        </td>
                        <td>
                          <span className={"badge " + t.priority}>{t.priority}</span>
                        </td>
                        <td className={"nowrap" + (isOverdue(t) ? " overdue" : "")}>
                          {formatDeadline(t.deadline)}
                        </td>
                        <td>
                          <span className="assignee">
                            <span className="mini-avatar">{name[0].toUpperCase()}</span>
                            {name}
                          </span>
                        </td>
                        <td>
                          <span className={"badge status-" + t.status}>{STATUS_LABEL[t.status]}</span>
                        </td>
                        <td className="nowrap">
                          <div className="trow-actions">
                            <Link to={`/tasks?id=${t.id}&edit=1`} className="icon-action" title="Edit">
                              <Pencil size={16} />
                            </Link>
                            <button
                              className="icon-action danger"
                              onClick={() => remove(t)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <span>
              {filtered.length === 0
                ? "No tasks to show"
                : `Showing ${startIdx + 1}-${startIdx + rows.length} of ${filtered.length} tasks`}
            </span>
            <div className="pager-btns">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-num">
                {current} / {pageCount}
              </span>
              <button
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <div className="dash-col">
          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Quick Actions</h2>
            </div>
            <div className="qa-grid">
              <Link to="/add" className="qa-tile blue">
                <Plus size={22} /> Add New Task
              </Link>
              <Link to="/users" className="qa-tile teal">
                <UsersIcon size={22} /> Manage Users
              </Link>
              <Link to="/reports" className="qa-tile purple">
                <BarChart3 size={22} /> View Reports
              </Link>
              <Link to="/settings" className="qa-tile slate">
                <SettingsIcon size={22} /> System Settings
              </Link>
            </div>
          </section>

          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Priority Breakdown</h2>
            </div>
            <div className="donut-wrap">
              <Donut high={high} medium={medium} low={low} label="To do" />
              <div className="legend">
                {legend.map((l) => (
                  <div key={l.name} className="legend-row">
                    <span className="legend-dot" style={{ background: l.color }} />
                    <span className="name">{l.name}</span>
                    <strong>{l.value}</strong>
                    <span className="pct">({total ? Math.round((l.value / total) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <p className="empty">No activity yet.</p>
            ) : (
              activity.map((e) => {
                const Icon = ACT_ICON[e.kind];
                return (
                  <div key={e.id} className="act-row">
                    <span className={"act-icon " + e.kind}>
                      <Icon size={17} />
                    </span>
                    <div>
                      <div className="act-text">{e.text}</div>
                      <div className="act-time">{timeAgo(e.time)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>

      <AdminExtras tasks={tasks} users={users} />
      
      <div className="sys-footer">
        <span className="sys-dot" /> System online <span>|</span> Last updated:{" "}
        {loadedAt.toLocaleString()}
      </div>
    </div>
  );
}