import { useState } from "react";
import { signupAdmin } from "../api";

export default function AdminSignup({ onDone, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", adminCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signupAdmin(form);
      onDone();
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
        <h1>Create Admin Account</h1>
        <p className="muted">You need the admin code from the backend .env file.</p>

        <label className="field"><span>FULL NAME</span><input value={form.name} onChange={set("name")} required /></label>
        <label className="field"><span>EMAIL</span><input type="email" value={form.email} onChange={set("email")} required /></label>
        <label className="field"><span>PASSWORD</span><input type="password" value={form.password} onChange={set("password")} required /></label>
        <label className="field"><span>ADMIN CODE</span><input type="password" value={form.adminCode} onChange={set("adminCode")} required /></label>

        {error && <div className="error">{error}</div>}

        <button className="btn" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>

        <div className="switch">
          Already have one? <button type="button" className="link" onClick={onLogin}>Login</button>
        </div>
      </form>
    </div>
  );
}
