import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "../api";
import "./tasks.css";
import "./calendar.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function timeOf(deadline) {
  if (!deadline || deadline.length <= 10) return "All day";
  return new Date(deadline).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function TaskLink({ task }) {
  return (
    <Link to={`/tasks?id=${task.id}`} className="day-item">
      <div className="day-top">
        <span className="day-title">{task.title}</span>
        <span className={"badge " + task.priority}>{task.priority}</span>
      </div>
      <div className="day-sub">
        <span className={"badge status-" + task.status}>{task.status}</span>
        <span>{timeOf(task.deadline)}</span>
      </div>
    </Link>
  );
}

export default function CalendarPage() {
  const todayKey = toKey(new Date());
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayKey);

  useEffect(() => {
    api("/tasks?sortBy=deadline&order=asc")
      .then((d) => setTasks(d.tasks))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!tasks) return <p className="loading">Loading...</p>;

  // group the tasks by their deadline day
  const byDay = {};
  tasks.forEach((t) => {
    if (!t.deadline) return;
    const key = t.deadline.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(t);
  });

  // 6 weeks x 7 days = 42 cells, starting on the Sunday before the 1st
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const monthKey = `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;
  const monthCount = tasks.filter((t) => t.deadline && t.deadline.startsWith(monthKey)).length;
  const dayTasks = byDay[selected] || [];
  const upcoming = tasks
    .filter((t) => t.deadline && t.status !== "completed" && t.deadline.slice(0, 10) >= todayKey)
    .slice(0, 5);

  const monthTitle = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedTitle = new Date(selected + "T00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function goToday() {
    const n = new Date();
    setMonth(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelected(todayKey);
  }

  function pickDay(d) {
    setSelected(toKey(d));
    if (d.getMonth() !== month.getMonth()) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  return (
    <div>
      <h1 className="page-title">Calendar</h1>
      <p className="muted">See your deadlines at a glance.</p>

      <div className="cal-layout">
        <section className="cal-card">
          <div className="cal-head">
            <h2>{monthTitle}</h2>
            <button className="cal-today-btn" onClick={goToday}>
              Today
            </button>
            <button
              className="cal-nav"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="cal-nav"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="cal-weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="cal-grid">
            {cells.map((d) => {
              const key = toKey(d);
              const list = byDay[key] || [];
              const classes =
                "cal-cell" +
                (d.getMonth() !== month.getMonth() ? " other" : "") +
                (key === todayKey ? " today" : "") +
                (key === selected ? " selected" : "");
              return (
                <button key={key} className={classes} onClick={() => pickDay(d)}>
                  <span className="cal-day">{d.getDate()}</span>
                  <span className="cal-chips">
                    {list.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={
                          "cal-chip " + t.priority + (t.status === "completed" ? " done" : "")
                        }
                      >
                        {t.title}
                      </span>
                    ))}
                    {list.length > 2 && <span className="cal-more">+{list.length - 2} more</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="cal-legend">
            <span><i style={{ background: "var(--high-main)" }} /> High</span>
            <span><i style={{ background: "var(--med-main)" }} /> Medium</span>
            <span><i style={{ background: "var(--low-main)" }} /> Low</span>
            <span>
              {monthCount} {monthCount === 1 ? "task" : "tasks"} due this month
            </span>
          </div>
        </section>

        <div className="cal-side">
          <section className="cal-card">
            <h3>{selectedTitle}</h3>
            <div className="cal-sub">
              {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"} due
            </div>
            {dayTasks.length === 0 ? (
              <div className="cal-empty">
                <p>No tasks on this day.</p>
                <Link to="/add" className="btn-primary btn-small">
                  <Plus size={16} /> Add task
                </Link>
              </div>
            ) : (
              dayTasks.map((t) => <TaskLink key={t.id} task={t} />)
            )}
          </section>

          <section className="cal-card">
            <h3>Upcoming</h3>
            <div className="cal-sub">Your next deadlines</div>
            {upcoming.length === 0 ? (
              <p className="cal-empty">Nothing coming up. Enjoy the free time!</p>
            ) : (
              upcoming.map((t) => (
                <TaskLink key={t.id} task={t} />
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}