import { useEffect, useState } from "react";
import { Archive, CircleCheck, RotateCcw } from "lucide-react";
import { api } from "../api";
import { formatDeadline, formatStamp } from "../utils";
import "./tasks.css";
import "./history.css";

export default function History() {
  const [tab, setTab] = useState("archive");
  const [archived, setArchived] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [error, setError] = useState("");

  function load() {
    Promise.all([
      api("/tasks/archive"),
      api("/tasks?status=completed&sortBy=createdAt&order=desc"),
    ])
      .then(([a, c]) => {
        setArchived(a.tasks);
        setCompleted(c.tasks);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(task) {
    try {
      await api(`/tasks/archive/${task.id}/restore`, { method: "POST" });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function reopen(task) {
    try {
      await api(`/tasks/${task.id}`, { method: "PUT", body: { status: "pending" } });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <div className="error">{error}</div>;
  if (!archived || !completed) return <p className="loading">Loading...</p>;

  return (
    <div>
      <h1 className="page-title">History</h1>
      <p className="muted">Deleted tasks are kept here so you can bring them back.</p>

      <div className="hist-cards">
        <div className="hist-card">
          <span className="hist-icon archive">
            <Archive size={24} />
          </span>
          <div>
            <div className="hist-num">{archived.length}</div>
            <div className="hist-label">In the archive</div>
          </div>
        </div>
        <div className="hist-card">
          <span className="hist-icon done">
            <CircleCheck size={24} />
          </span>
          <div>
            <div className="hist-num">{completed.length}</div>
            <div className="hist-label">Completed tasks</div>
          </div>
        </div>
      </div>

      <section className="hist-panel">
        <div className="seg">
          <button className={tab === "archive" ? "active" : ""} onClick={() => setTab("archive")}>
            Archive
          </button>
          <button className={tab === "completed" ? "active" : ""} onClick={() => setTab("completed")}>
            Completed
          </button>
        </div>

        {tab === "archive" && (
          <>
            <div className="hist-note">
              The archive works like a stack: the task you deleted last is always on top.
            </div>
            {archived.length === 0 ? (
              <p className="empty">The archive is empty. Deleted tasks will show up here.</p>
            ) : (
              archived.map((t) => (
                <div key={t.id} className="hist-row">
                  <div className="hist-main">
                    <div className="hist-title">{t.title}</div>
                    <div className="hist-sub">
                      Deleted {formatStamp(t.deletedAt)} · {t.description || "No description"}
                    </div>
                  </div>
                  <span className={"badge " + t.priority}>{t.priority}</span>
                  <button className="btn-ghost btn-small" onClick={() => restore(t)}>
                    <RotateCcw size={15} /> Restore
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {tab === "completed" && (
          <>
            {completed.length === 0 ? (
              <p className="empty">No completed tasks yet. Finish one and it will appear here.</p>
            ) : (
              completed.map((t) => (
                <div key={t.id} className="hist-row">
                  <div className="hist-main">
                    <div className="hist-title">{t.title}</div>
                    <div className="hist-sub">
                      Last updated {formatStamp(t.updatedAt)} · Due {formatDeadline(t.deadline)}
                    </div>
                  </div>
                  <span className={"badge " + t.priority}>{t.priority}</span>
                  <button className="btn-ghost btn-small" onClick={() => reopen(t)}>
                    <RotateCcw size={15} /> Reopen
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </section>
    </div>
  );
}