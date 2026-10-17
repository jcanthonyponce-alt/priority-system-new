import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import "../components/avatar.css";
import "./tasks.css";
import "./account.css";

// crop the chosen picture to a small square so it stays light
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the picture"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid picture"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const isAdmin = user.role === "admin";

  useEffect(() => {
    api("/tasks/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  async function onPick(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "err", text: "Please choose an image file" });
      return;
    }
    try {
      setAvatar(await resizeImage(file));
      setMsg({ type: "ok", text: "Photo ready. Click Save changes to keep it." });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    }
  }

  function removePhoto() {
    setAvatar("");
    setMsg({ type: "ok", text: "Photo removed. Click Save changes to confirm." });
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api("/auth/me", { method: "PUT", body: { fullName, email, avatar } });
      await refresh();
      setMsg({ type: "ok", text: "Profile updated" });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const displayName = fullName.trim() || user.username;

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="muted">Your account details and photo.</p>

      <div className="acc-grid">
        <section className="acc-card profile-card">
          {avatar ? (
            <img className="big-avatar" src={avatar} alt="Your profile" />
          ) : (
            <div className="big-avatar">{user.username[0].toUpperCase()}</div>
          )}

          <div className="photo-actions">
            <button type="button" className="btn-ghost btn-small" onClick={() => fileRef.current.click()}>
              <Camera size={15} /> {avatar ? "Change photo" : "Add photo"}
            </button>
            {avatar && (
              <button type="button" className="btn-danger btn-small" onClick={removePhoto}>
                <Trash2 size={15} /> Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

          <h2>{displayName}</h2>
          <span className="role-pill">{user.role}</span>
          <div className="profile-meta">
            <div>@{user.username}</div>
            <div>{user.email}</div>
            <div>
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
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
                <label>Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={60}
                />
              </div>
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