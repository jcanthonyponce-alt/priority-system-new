import { useNavigate } from "react-router-dom";
import { api } from "../api";
import TaskForm from "../components/TaskForm";
import "./tasks.css";

export default function AddTask() {
  const navigate = useNavigate();

  async function create(values) {
    const d = await api("/tasks", { method: "POST", body: values });
    navigate(`/tasks?id=${d.task.id}`);
  }

  return (
    <div>
      <h1 className="page-title">Add Task</h1>
      <p className="muted">Fill in the details and choose a priority.</p>

      <div className="add-grid">
        <div className="form-card">
          <TaskForm submitLabel="Add task" onSubmit={create} onCancel={() => navigate(-1)} />
        </div>

        <div className="form-card">
          <h3 className="guide-title">Priority guide</h3>
          <div className="guide-item">
            <span className="guide-dot" style={{ background: "var(--high-main)" }} />
            <div>
              <strong>High</strong>
              <p>Urgent and important. Do these first.</p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-dot" style={{ background: "var(--med-main)" }} />
            <div>
              <strong>Medium</strong>
              <p>Important, but not urgent. Plan time for them.</p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-dot" style={{ background: "var(--low-main)" }} />
            <div>
              <strong>Low</strong>
              <p>Can wait. Do them when you have free time.</p>
            </div>
          </div>
          <p className="guide-note">
            Tip: your most urgent tasks always appear first on the dashboard, sorted by
            priority and then by deadline.
          </p>
        </div>
      </div>
    </div>
  );
}