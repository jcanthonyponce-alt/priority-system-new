import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-page">
      <form className="card" onSubmit={handleSubmit}>
        <div className="brand">✔ Priority System</div>
        <h1>Welcome back</h1>
        <p className="muted">Log in to see your tasks.</p>

        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        <button className="btn" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>

        <p className="switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}