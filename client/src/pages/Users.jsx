import { useEffect, useState } from "react";
import {
  Archive,
  CircleCheck,
  ListChecks,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import "./dashboard.css";
import "./tasks.css";
import "./admin.css";

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  function load() {
    Promise.all([api("/admin/users"), api("/admin/overview")])
      .then(([u, o]) => {
        setUsers(u.users);
        setOverview(o);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(u) {
    const makeAdmin = u.role !== "admin";
    const message = makeAdmin
      ? `Make ${u.username} an administrator? They will be able to see and manage all users and tasks.`
      : `Remove administrator access from ${u.username}?`;
    if (!window.confirm(message)) return;
    try {
      await api(`/admin/users/${u.id}/role`, {
        method: "PUT",
        body: { role: makeAdmin ? "admin" : "user" },
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeUser(u) {
    const ok = window.confirm(
      `Delete ${u.username}? Their ${u.taskCount} tasks will be moved to the archive.`
    );
    if (!ok) return;
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <div className="error">{error}</div>;
  if (!users || !overview) return <p className="loading">Loading...</p>;

  const q = search.trim().toLowerCase();
  const shown = users.filter(
    (u) => !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  const admins = users.filter((u) => u.role === "admin").length;

  const cards = [
    { cls: "total", title: "Registered users", count: overview.users, icon: UsersIcon },
    { cls: "extra", title: "Administrators", count: admins, icon: ShieldCheck },
    { cls: "medium", title: "Total tasks", count: overview.tasks, icon: ListChecks },
    { cls: "low", title: "Completed tasks", count: overview.completed, icon: CircleCheck },
    { cls: "total", title: "In the archive", count: overview.archived, icon: Archive },
  ];

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <p className="muted">Everyone who has an account in the system.</p>

      <div className="pcards five">
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
              <div className="pcard-num">{c.count}</div>
            </div>
          );
        })}
      </div>

      <section className="dpanel">
        <div className="dpanel-head">
          <h2>
            {shown.length} {shown.length === 1 ? "user" : "users"}
          </h2>
        </div>

        <div className="admin-tools">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Tasks</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No users found.
                  </td>
                </tr>
              ) : (
                shown.map((u) => {
                  const pct = u.taskCount ? Math.round((u.completedCount / u.taskCount) * 100) : 0;
                  const isMe = u.id === me.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="user-cell">
                          <span className="mini-avatar">{u.username[0].toUpperCase()}</span>
                          {u.username}
                          {isMe && (
                            <span style={{ fontWeight: 400, color: "var(--muted)" }}>(you)</span>
                          )}
                        </span>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={"badge role-" + u.role}>{u.role}</span>
                      </td>
                      <td className="nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>{u.taskCount}</td>
                      <td>
                        <div className="bar">
                          <span style={{ width: pct + "%" }} />
                        </div>
                        <div className="bar-label">
                          {u.completedCount}/{u.taskCount} done
                        </div>
                      </td>
                      <td className="nowrap">
                        <div className="trow-actions">
                          {!isMe && (
                            <button className="btn-ghost btn-small" onClick={() => changeRole(u)}>
                              {u.role === "admin" ? (
                                <>
                                  <ShieldOff size={15} /> Remove admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={15} /> Make admin
                                </>
                              )}
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              className="icon-action danger"
                              onClick={() => removeUser(u)}
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}