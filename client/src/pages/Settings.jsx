import { useState } from "react";
import { Moon, Palette, Shield, Sparkles, Sun, Waves } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import "./tasks.css";
import "./account.css";

const THEMES = [
  {
    id: "light",
    label: "Light",
    desc: "Fresh greens inspired by nature",
    icon: Sun,
    swatch: "linear-gradient(90deg, #e6f3da 32%, #f8fcf4 32%)",
  },
  {
    id: "dark",
    label: "Dark",
    desc: "Easy on the eyes at night",
    icon: Moon,
    swatch: "linear-gradient(90deg, #060b17 32%, #131c2e 32%)",
  },
  {
    id: "colorful",
    label: "Violet",
    desc: "Bright purple and blue",
    icon: Palette,
    swatch: "linear-gradient(90deg, #2e1b80 32%, #ece5ff 32%)",
  },
  {
    id: "ocean",
    label: "Ocean glass",
    desc: "Glowing blue with glass cards",
    icon: Waves,
    swatch: "linear-gradient(135deg, #0a3fd8, #4ea1ff)",
  },
  {
    id: "neon",
    label: "Neon night",
    desc: "Dark with purple and pink glow",
    icon: Sparkles,
    swatch: "linear-gradient(135deg, #7c3aed, #ec4899)",
  },
  {
    id: "metal",
    label: "Metallic",
    desc: "Brushed steel with a blue glow",
    icon: Shield,
    swatch: "linear-gradient(135deg, #7d8a9c, #1a2230)",
  },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) {
      setMsg({ type: "err", text: "New password must be at least 6 characters" });
      return;
    }
    if (next !== confirm) {
      setMsg({ type: "err", text: "The new passwords do not match" });
      return;
    }
    setBusy(true);
    try {
      await api("/auth/password", {
        method: "PUT",
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({ type: "ok", text: "Password changed" });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="muted">Choose how the app looks and keep your account safe.</p>

      <div className="acc-stack" style={{ maxWidth: 820, marginTop: 20 }}>
        <section className="acc-card">
          <h2>Appearance</h2>
          <p className="acc-sub">Your choice is saved for your account on this device.</p>
          <div className="theme-cards">
            {THEMES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={"theme-card" + (theme === t.id ? " active" : "")}
                  onClick={() => setTheme(t.id)}
                >
                  <div className="swatch" style={{ background: t.swatch }} />
                  <strong>
                    <Icon size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                    {t.label}
                  </strong>
                  <span>{t.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="acc-card">
          <h2>Change password</h2>
          <p className="acc-sub">Use at least 6 characters.</p>
          {user.role === "admin" && (
            <div className="admin-warn">
              The admin account starts with a default password. Change it before you show or
              share the project.
            </div>
          )}
          {msg && <div className={"acc-msg " + msg.type}>{msg.text}</div>}
          <form onSubmit={changePassword}>
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Change password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}