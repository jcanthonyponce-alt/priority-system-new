import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await register(username, email, password);
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
        <h1>Create your account</h1>
        <p className="muted">It only takes a few seconds.</p>

        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="At least 3 characters"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label>Confirm password</label>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
          />
        </div>

        <button className="btn" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>

        <p className="switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}