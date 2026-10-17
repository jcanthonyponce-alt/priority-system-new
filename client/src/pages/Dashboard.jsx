import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  History as HistoryIcon,
  Hourglass,
  ListChecks,
  Pencil,
  Plus,
  Quote,
  Trash2,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Donut from "../components/Donut";
import { CATEGORIES, CategoryTag } from "../categories";
import { isOverdue } from "../utils";
import "./dashboard.css";
import "./tasks.css";
import "./dashboard-extra.css";

const QUOTES = [
  "Small steps make a big difference.",
  "Done is better than perfect.",
  "Focus on the next task, not the whole mountain.",
  "What you do today shapes tomorrow.",
  "Finish one thing, then pick the next.",
  "Progress, not perfection.",
  "Start small. Keep going.",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function dueLabel(deadline) {
  if (!deadline) return "No deadline";
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);
  const time =
    deadline.length > 10
      ? ", " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";
  if (diff === 0) return "Today" + time;
  if (diff === 1) return "Tomorrow" + time;
  if (diff < 0) return "Overdue: " + d.toLocaleDateString() + time;
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + time
  );
}

/* ---------- Quick add task ---------- */
function QuickAdd({ onAdded }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 2) {
      setError("Enter a task name (at least 2 characters)");
      return;
    }
    setBusy(true);
    try {
      await api("/tasks", {
        method: "POST",
        body: { title, priority, category, deadline: due },
      });
      setTitle("");
      setDue("");
      setPriority("medium");
      setCategory("general");
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="qadd" onSubmit={submit}>
      {error && <div className="error">{error}</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task name..."
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="high">High priority</option>
        <option value="medium">Medium priority</option>
        <option value="low">Low priority</option>
      </select>
      <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
      <button className="btn-primary" disabled={busy}>
        <Plus size={16} /> {busy ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

/* ---------- Mini calendar ---------- */
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function MiniCalendar({ tasks }) {
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const todayKey = keyOf(new Date());
  const busyDays = new Set(
    tasks.filter((t) => t.deadline && t.status !== "completed").map((t) => t.deadline.slice(0, 10))
  );

  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const title = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mini-head">
        <strong>{title}</strong>
        <div className="mini-nav">
          <button
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="mini-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mini-grid">
        {cells.map((d) => {
          const key = keyOf(d);
          const cls =
            "mini-day" +
            (d.getMonth() !== month.getMonth() ? " other" : "") +
            (key === todayKey ? " today" : "") +
            (busyDays.has(key) ? " has" : "");
          return (
            <div key={key} className={cls}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  function load() {
    api("/tasks?sortBy=deadline&order=asc")
      .then((d) => setTasks(d.tasks))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleDone(task) {
    try {
      await api(`/tasks/${task.id}`, {
        method: "PUT",
        body: { status: task.status === "completed" ? "pending" : "completed" },
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

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

  const todo = tasks.filter((t) => t.status !== "completed");
  const countOf = (p) => todo.filter((t) => t.priority === p).length;
  const high = countOf("high");
  const medium = countOf("medium");
  const low = countOf("low");
  const total = high + medium + low;
  const shown = filter === "all" ? todo : todo.filter((t) => t.priority === filter);
  const recent = [...tasks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const done = tasks.filter((t) => t.status === "completed").length;
  const doing = tasks.filter((t) => t.status === "in-progress").length;
  const waiting = tasks.filter((t) => t.status === "pending").length;
  const late = tasks.filter(isOverdue).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const progressBoxes = [
    { cls: "done", label: "Completed", value: done, icon: CircleCheck },
    { cls: "doing", label: "In progress", value: doing, icon: Clock },
    { cls: "todo", label: "Pending", value: waiting, icon: Hourglass },
    { cls: "late", label: "Overdue", value: late, icon: CircleAlert },
  ];

  const cards = [
    { cls: "high", title: "High Priority", count: high, sub: "Tasks to do", icon: CircleAlert },
    { cls: "medium", title: "Medium Priority", count: medium, sub: "Tasks to do", icon: Clock },
    { cls: "low", title: "Low Priority", count: low, sub: "Tasks to do", icon: CircleCheck },
    { cls: "total", title: "Total Tasks", count: tasks.length, sub: "All tasks", icon: ListChecks },
  ];

  const legend = [
    { name: "High", value: high, color: "var(--high-main)" },
    { name: "Medium", value: medium, color: "var(--med-main)" },
    { name: "Low", value: low, color: "var(--low-main)" },
  ];

  // how many tasks are in each category ("General" only shows when it has tasks)
  const catCounts = CATEGORIES.map((c) => ({
    ...c,
    count: tasks.filter((t) => t.category === c.id).length,
  })).filter((c) => c.id !== "general" || c.count > 0);

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div>
      <h1 className="page-title">
        {greeting()}, {user.username}!
      </h1>
      <p className="muted">Here is an overview of your tasks and priorities.</p>

      <section className="hero">
        <div className="hero-text">
          <h2>Stay productive, reach your goals</h2>
          <p>Organize your tasks, focus on what matters most and make every day count.</p>
          <Link to="/add" className="hero-btn">
            <Plus size={18} /> Add New Task
          </Link>
        </div>
        <svg
          className="hero-art"
          viewBox="0 0 600 170"
          preserveAspectRatio="xMaxYMax slice"
          aria-hidden="true"
        >
          <circle cx="470" cy="50" r="28" fill="#fff" opacity="0.2" />
          <path d="M0 170 L0 112 Q120 48 250 104 T500 84 T600 96 L600 170 Z" fill="#fff" opacity="0.14" />
          <path d="M0 170 L0 134 Q150 92 300 128 T600 116 L600 170 Z" fill="#fff" opacity="0.12" />
        </svg>
      </section>

      <div className="pcards">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.cls} to="/tasks" className={"pcard " + c.cls}>
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

      <div className="dash-grid">
        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Today's Tasks</h2>
            <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="empty">Nothing to do here. You are all caught up!</p>
          ) : (
            shown.map((t) => (
              <div key={t.id} className="trow">
                <button
                  className="check"
                  onClick={() => toggleDone(t)}
                  title="Mark as completed"
                  aria-label="Mark as completed"
                />
                <div className="trow-title">{t.title}</div>
                <CategoryTag id={t.category} />
                <span className={"badge " + t.priority}>{t.priority}</span>
                <div className={"trow-date" + (isOverdue(t) ? " overdue" : "")}>
                  <Calendar size={15} />
                  {dueLabel(t.deadline)}
                </div>
                <div className="trow-actions">
                  <Link to={`/tasks?id=${t.id}&edit=1`} className="icon-action" title="Edit">
                    <Pencil size={16} />
                  </Link>
                  <button className="icon-action danger" onClick={() => remove(t)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="dash-col">
          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Today's Progress</h2>
            </div>
            <div className="prog-head">
              <span>
                <strong>{done}</strong> / {tasks.length} tasks
              </span>
              <strong>{pct}%</strong>
            </div>
            <div className="prog-bar">
              <span style={{ width: pct + "%" }} />
            </div>
            <div className="prog-grid">
              {progressBoxes.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.cls} className={"prog-box " + b.cls}>
                    <span className="prog-ico">
                      <Icon size={17} />
                    </span>
                    <strong>{b.value}</strong>
                    <span className="lbl">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Quick Add Task</h2>
            </div>
            <QuickAdd onAdded={load} />
          </section>

          <section className="dpanel">
            <div className="dpanel-head">
              <h2>Priority Breakdown</h2>
            </div>
            <div className="donut-wrap">
              <Donut high={high} medium={medium} low={low} />
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
        </div>
      </div>

      <div className="bottom-grid">
        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Task Categories</h2>
            <Link to="/tasks">View all</Link>
          </div>
          <div className="cat-list">
            {catCounts.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.id}
                  to={`/tasks?category=${c.id}`}
                  className="cat-row"
                  style={{ "--c": c.color }}
                >
                  <span className="cat-ico">
                    <Icon size={18} />
                  </span>
                  <span className="cat-name">{c.label}</span>
                  <span className="cat-count">{c.count}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Calendar</h2>
            <Link to="/calendar">Open</Link>
          </div>
          <MiniCalendar tasks={tasks} />
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Recent tasks</h2>
            <Link to="/tasks">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty">No tasks yet. Add your first one!</p>
          ) : (
            recent.map((t) => (
              <div key={t.id} className="recent-row">
                <div className="recent-main">
                  <div className="recent-title">{t.title}</div>
                  <div className="recent-sub">
                    Added {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <CategoryTag id={t.category} />
                <span className={"badge " + t.priority}>{t.priority}</span>
              </div>
            ))
          )}
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Daily Motivation</h2>
          </div>
          <div className="motivation">
            <span className="motivation-icon">
              <Quote size={22} />
            </span>
            <div className="quote">{quote}</div>
            <div className="quote-by">Daily reminder</div>
          </div>
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Quick Actions</h2>
          </div>
          <Link to="/add" className="qa-primary">
            <Plus size={18} /> Add New Task
          </Link>
          <Link to="/calendar" className="qa-link">
            <Calendar size={18} />
            <span>View Calendar</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/tasks" className="qa-link">
            <ListChecks size={18} />
            <span>View All Tasks</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/history" className="qa-link">
            <HistoryIcon size={18} />
            <span>View History</span>
            <ChevronRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}