import { useEffect, useState } from "react";
import { Archive, CircleAlert, CircleCheck, Clock } from "lucide-react";
import { api } from "../api";
import Donut from "../components/Donut";
import { isOverdue } from "../utils";
import "./dashboard.css";
import "./admin.css";
import "./reports.css";

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function HBar({ name, value, max, color, label, doneValue }) {
  return (
    <div className="hbar-row">
      <span className="hbar-name">{name}</span>
      <div className="hbar-track">
        <span
          className="hbar-fill"
          style={{ width: (max ? (value / max) * 100 : 0) + "%", background: color }}
        />
        {doneValue !== undefined && (
          <span
            className="hbar-fill"
            style={{
              width: (max ? (doneValue / max) * 100 : 0) + "%",
              background: "var(--low-main)",
            }}
          />
        )}
      </div>
      <span className="hbar-val">{label}</span>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/tasks"), api("/admin/users"), api("/admin/overview")])
      .then(([t, u, o]) => setData({ tasks: t.tasks, users: u.users, overview: o }))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="loading">Loading...</p>;

  const { tasks, users, overview } = data;
  const total = tasks.length;
  const countBy = (field, value) => tasks.filter((t) => t[field] === value).length;

  const done = countBy("status", "completed");
  const rate = total ? Math.round((done / total) * 100) : 0;
  const overdue = tasks.filter(isOverdue).length;
  const inProgress = countBy("status", "in-progress");

  const byStatus = [
    { name: "Pending", value: countBy("status", "pending"), color: "var(--med-main)" },
    { name: "In progress", value: inProgress, color: "var(--total-main)" },
    { name: "Completed", value: done, color: "var(--low-main)" },
  ];
  const statusMax = Math.max(1, ...byStatus.map((s) => s.value));

  const perUser = users
    .filter((u) => u.role === "user")
    .sort((a, b) => b.taskCount - a.taskCount);
  const userMax = Math.max(1, ...perUser.map((u) => u.taskCount));

  // tasks added per day for the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: "short" }), count: 0 };
  });
  tasks.forEach((t) => {
    const slot = days.find((d) => d.key === dayKey(new Date(t.createdAt)));
    if (slot) slot.count++;
  });
  const dayMax = Math.max(1, ...days.map((d) => d.count));

  const cards = [
    { cls: "low", title: "Completion rate", value: rate + "%", icon: CircleCheck },
    { cls: "high", title: "Overdue tasks", value: overdue, icon: CircleAlert },
    { cls: "total", title: "In progress", value: inProgress, icon: Clock },
    { cls: "medium", title: "In the archive", value: overview.archived, icon: Archive },
  ];

  const legend = [
    { name: "High", value: countBy("priority", "high"), color: "var(--high-main)" },
    { name: "Medium", value: countBy("priority", "medium"), color: "var(--med-main)" },
    { name: "Low", value: countBy("priority", "low"), color: "var(--low-main)" },
  ];

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="muted">How the whole system is doing, across all users.</p>

      <div className="pcards four">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className={"pcard " + c.cls}>
              <div className="pcard-head">
                <span className="pcard-icon">
                  <Icon size={18} />
                </span>
                {c.title}
              </div>
              <div className="pcard-num">{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rep-grid">
        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Tasks by status</h2>
          </div>
          {byStatus.map((s) => (
            <HBar
              key={s.name}
              name={s.name}
              value={s.value}
              max={statusMax}
              color={s.color}
              label={s.value}
            />
          ))}
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Tasks by priority</h2>
          </div>
          <div className="donut-wrap">
            <Donut
              high={legend[0].value}
              medium={legend[1].value}
              low={legend[2].value}
              label="All tasks"
            />
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
            <h2>Tasks per user</h2>
          </div>
          <p className="rep-note">Green shows how many of each user's tasks are done.</p>
          {perUser.length === 0 ? (
            <p className="empty">No users yet.</p>
          ) : (
            perUser.map((u) => (
              <HBar
                key={u.id}
                name={u.username}
                value={u.taskCount}
                doneValue={u.completedCount}
                max={userMax}
                color="var(--total-main)"
                label={`${u.completedCount}/${u.taskCount}`}
              />
            ))
          )}
        </section>

        <section className="dpanel">
          <div className="dpanel-head">
            <h2>Added in the last 7 days</h2>
          </div>
          <div className="vbars">
            {days.map((d) => (
              <div key={d.key} className="vbar">
                <span className="vbar-count">{d.count}</span>
                <div
                  className="vbar-fill"
                  style={{ height: Math.max(4, (d.count / dayMax) * 120) + "px" }}
                />
                <span className="vbar-day">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}