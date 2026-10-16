import { useState } from "react";
import { login } from "../api";

export default function AdminLogin({ onSuccess, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <form className="panel" onSubmit={submit}>
        <div className="brand">CITYLENS AI</div>
        <h1>Admin Login</h1>
        <p className="muted">Sign in to the control room.</p>

        <label className="field">
          <span>EMAIL</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>PASSWORD</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>

        <div className="switch">
          Need an admin account? <button type="button" className="link" onClick={onSignup}>Sign up</button>
        </div>
      </form>
    </div>
  );
}
