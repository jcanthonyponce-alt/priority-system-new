import { useEffect, useState } from "react";
import { ChartLine, ShieldCheck } from "lucide-react";
import { api } from "../api";
import "./extras.css";

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const SERIES = [
  { key: "high", name: "High", color: "var(--high-main)" },
  { key: "medium", name: "Medium", color: "var(--med-main)" },
  { key: "low", name: "Low", color: "var(--low-main)" },
];

function TaskTrends({ tasks }) {
  // tasks added per day over the last 7 days, split by priority
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      key: dayKey(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      high: 0,
      medium: 0,
      low: 0,
    };
  });
  tasks.forEach((t) => {
    const slot = days.find((d) => d.key === dayKey(new Date(t.createdAt)));
    if (slot) slot[t.priority]++;
  });

  const maxVal = Math.max(4, ...days.flatMap((d) => [d.high, d.medium, d.low]));
  const top = Math.ceil(maxVal / 2) * 2;
  const W = 520;
  const H = 200;
  const L = 34;
  const R = 10;
  const T = 12;
  const B = 28;
  const x = (i) => L + (i * (W - L - R)) / 6;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const ticks = [0, top / 2, top];

  return (
    <div className="trend-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="trend-svg"
        role="img"
        aria-label="Tasks added in the last 7 days by priority"
      >
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} className="trend-grid" />
            <text x={L - 8} y={y(tk) + 4} textAnchor="end" className="trend-tick">
              {tk}
            </text>
          </g>
        ))}
        {days.map((d, i) => (
          <text key={d.key} x={x(i)} y={H - 8} textAnchor="middle" className="trend-tick">
            {d.label}
          </text>
        ))}
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={days.map((d, i) => `${x(i)},${y(d[s.key])}`).join(" ")}
            />
            {days.map((d, i) => (
              <circle key={i} cx={x(i)} cy={y(d[s.key])} r="3.5" fill={s.color} />
            ))}
          </g>
        ))}
      </svg>

      <div className="trend-legend">
        {SERIES.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SystemOverview({ tasks, users }) {
  const [ping, setPing] = useState(null); // milliseconds, or -1 if the server is down

  useEffect(() => {
    const start = performance.now();
    api("/health")
      .then(() => setPing(Math.round(performance.now() - start)))
      .catch(() => setPing(-1));
  }, []);

  const registered = users.filter((u) => u.role === "user").length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  let statusText = "Checking the server...";
  let statusClass = "";
  if (ping !== null && ping >= 0) {
    statusText = "System working normally";
    statusClass = "up";
  } else if (ping === -1) {
    statusText = "Server is not responding";
    statusClass = "down";
  }

  return (
    <div>
      <div className={"ov-status " + statusClass}>
        <span className="ov-dot" /> {statusText}
      </div>
      <div className="ov-stats">
        <div className="ov-stat">
          <strong>{registered}</strong>
          <span>Total users</span>
        </div>
        <div className="ov-stat">
          <strong>{tasks.length}</strong>
          <span>Total tasks</span>
        </div>
        <div className="ov-stat">
          <strong>{rate}%</strong>
          <span>Completed</span>
        </div>
        <div className="ov-stat">
          <strong>{ping !== null && ping >= 0 ? ping + " ms" : "-"}</strong>
          <span>Server response</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminExtras({ tasks, users }) {
  return (
    <div className="extras-grid">
      <section className="dpanel">
        <div className="dpanel-head">
          <h2>Task Trends</h2>
          <ChartLine size={18} />
        </div>
        <p className="extras-note">Tasks added in the last 7 days, by priority</p>
        <TaskTrends tasks={tasks} />
      </section>

      <section className="dpanel">
        <div className="dpanel-head">
          <h2>System Overview</h2>
          <ShieldCheck size={18} />
        </div>
        <SystemOverview tasks={tasks} users={users} />
      </section>
    </div>
  );
}