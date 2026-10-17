import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ClipboardList, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../api";
import TaskForm from "../components/TaskForm";
import { CATEGORIES, CategoryTag } from "../categories";
import { formatDeadline, formatStamp, isOverdue } from "../utils";
import "./tasks.css";

const STATUS_OPTIONS = [
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

export default function MyTasks() {
  const [params] = useSearchParams();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState(params.get("priority") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [selectedId, setSelectedId] = useState(params.get("id"));
  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [reloadKey, setReloadKey] = useState(0);

  
  // the search bar at the top of the page sends its text here
  useEffect(() => {
    setSearch(params.get("search") || "");
  }, [params]);

  useEffect(() => {
    let ignore = false;
    const q = new URLSearchParams({ sortBy, order });
    if (search.trim()) q.set("search", search.trim());
    if (status) q.set("status", status);
    if (priority) q.set("priority", priority);
    if (category) q.set("category", category);

    api("/tasks?" + q.toString())
      .then((d) => {
        if (!ignore) {
          setTasks(d.tasks);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });

    return () => {
      ignore = true;
    };
  }, [search, status, priority, category, sortBy, order, reloadKey]);

  if (error && !tasks) return <div className="error">{error}</div>;
  if (!tasks) return <p className="loading">Loading...</p>;

  const selected = tasks.find((t) => t.id === selectedId) || tasks[0] || null;
  const reload = () => setReloadKey((k) => k + 1);

  async function saveEdit(values) {
    await api(`/tasks/${selected.id}`, { method: "PUT", body: values });
    setEditing(false);
    reload();
  }

  async function changeStatus(task, newStatus) {
    try {
      await api(`/tasks/${task.id}`, { method: "PUT", body: { status: newStatus } });
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(task) {
    if (!window.confirm(`Move "${task.title}" to the archive?`)) return;
    try {
      await api(`/tasks/${task.id}`, { method: "DELETE" });
      setSelectedId(null);
      setEditing(false);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">My Tasks</h1>
      <p className="muted">Pick a task from the list to see its details.</p>

      <div className="tasks-layout">
        {/* ---------- left: list ---------- */}
        <div className="tasks-list">
          <div className="tl-head">
            <div className="tl-head-top">
              <h2>{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</h2>
              <Link to="/add" className="btn-primary btn-small">
                <Plus size={16} /> New
              </Link>
            </div>

            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>

            <div className="tl-filters">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ gridColumn: "1 / -1" }}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tl-sort">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="createdAt">Sort: date added</option>
                <option value="title">Sort: title</option>
                <option value="priority">Sort: priority</option>
                <option value="deadline">Sort: deadline</option>
              </select>
              <button
                className="dir-btn"
                onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                title={order === "asc" ? "Ascending" : "Descending"}
                aria-label="Change sort direction"
              >
                {order === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </button>
            </div>
          </div>

          <div className="tl-items">
            {tasks.length === 0 ? (
              <p className="empty">No tasks found.</p>
            ) : (
              tasks.map((t) => (
                <button
                  key={t.id}
                  className={"tl-item" + (selected && t.id === selected.id ? " active" : "")}
                  onClick={() => {
                    setSelectedId(t.id);
                    setEditing(false);
                  }}
                >
                  <div className="tl-top">
                    <span className="tl-title">{t.title}</span>
                    <span className={"badge " + t.priority}>{t.priority}</span>
                  </div>
                  <div className="tl-sub" style={{ flexWrap: "wrap" }}>
                    <span className={"badge status-" + t.status}>{t.status}</span>
                    <CategoryTag id={t.category} />
                    <span className={isOverdue(t) ? "overdue" : ""}>
                      {formatDeadline(t.deadline)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ---------- right: details ---------- */}
        <div className="tasks-detail">
          {selected && editing ? (
            <div className="edit-wrap">
              <h2>Edit task</h2>
              <TaskForm
                key={selected.id}
                task={selected}
                submitLabel="Save changes"
                onSubmit={saveEdit}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : selected ? (
            <div className="detail">
              <div className="detail-head">
                <h2>{selected.title}</h2>
                <div className="detail-actions">
                  <button className="btn-ghost btn-small" onClick={() => setEditing(true)}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button className="btn-danger btn-small" onClick={() => remove(selected)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>

              <div className="detail-badges">
                <span className={"badge " + selected.priority}>{selected.priority} priority</span>
                <span className={"badge status-" + selected.status}>{selected.status}</span>
                <CategoryTag id={selected.category} />
              </div>

              {isOverdue(selected) && <div className="error">This task is overdue.</div>}

              <div className="detail-block">
                <div className="detail-label">Description</div>
                <p>{selected.description || "No description added."}</p>
              </div>

              <div className="detail-grid">
                <div>
                  <div className="detail-label">Deadline</div>
                  <div>{formatDeadline(selected.deadline)}</div>
                </div>
                <div>
                  <div className="detail-label">Created</div>
                  <div>{formatStamp(selected.createdAt)}</div>
                </div>
                <div>
                  <div className="detail-label">Last updated</div>
                  <div>{formatStamp(selected.updatedAt)}</div>
                </div>
              </div>

              <div className="detail-status">
                <div className="detail-label">Change status</div>
                <div className="seg">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      className={selected.status === s.id ? "active" : ""}
                      onClick={() => changeStatus(selected, s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="detail-empty">
              <ClipboardList size={44} />
              <h3>No tasks yet</h3>
              <p>Create your first task and it will show up here.</p>
              <Link to="/add" className="btn-primary">
                Add a task
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}