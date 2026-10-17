import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import "./tasks.css";
import "./account.css";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState(user.email);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = user.role === "admin";

  useEffect(() => {
    api("/tasks/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api("/auth/me", { method: "PUT", body: { email } });
      await refresh();
      setMsg({ type: "ok", text: "Profile updated" });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="muted">Your account details.</p>

      <div className="acc-grid">
        <section className="acc-card profile-card">
          <div className="big-avatar">{user.username[0].toUpperCase()}</div>
          <h2>{user.username}</h2>
          <span className="role-pill">{user.role}</span>
          <div className="profile-meta">
            <div>{user.email}</div>
            <div>
              Member since{" "}
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </div>
          </div>
        </section>

        <div className="acc-stack">
          <section className="acc-card">
            <h2>{isAdmin ? "System tasks" : "Your tasks"}</h2>
            <p className="acc-sub">
              {isAdmin ? "Across all users." : "A quick look at your progress."}
            </p>
            {stats ? (
              <div className="stat-row">
                <div className="stat-box">
                  <strong>{stats.total}</strong>
                  <span>Total</span>
                </div>
                <div className="stat-box">
                  <strong>{stats.pending}</strong>
                  <span>Pending</span>
                </div>
                <div className="stat-box">
                  <strong>{stats.inProgress}</strong>
                  <span>In progress</span>
                </div>
                <div className="stat-box">
                  <strong>{stats.completed}</strong>
                  <span>Completed</span>
                </div>
                <div className="stat-box">
                  <strong>{stats.overdue}</strong>
                  <span>Overdue</span>
                </div>
              </div>
            ) : (
              <p className="muted">Loading...</p>
            )}
          </section>

          <section className="acc-card">
            <h2>Edit profile</h2>
            <p className="acc-sub">Your username cannot be changed.</p>
            {msg && <div className={"acc-msg " + msg.type}>{msg.text}</div>}
            <form onSubmit={save}>
              <div className="field">
                <label>Username</label>
                <input value={user.username} disabled />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}