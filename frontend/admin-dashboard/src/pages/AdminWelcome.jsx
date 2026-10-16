export default function AdminWelcome({ onLogin, onSignup }) {
  return (
    <div className="center-page">
      <div className="hero">
        <div className="brand">CITYLENS AI</div>
        <h1>Urban Decision Intelligence</h1>
        <p className="muted">
          Live emergencies, citizen incident reports and flood risk for Mumbai - in one control room.
        </p>
        <button className="btn" onClick={onLogin}>Admin Login</button>
        <button className="btn ghost" style={{ maxWidth: 260, margin: "12px auto 0" }} onClick={onSignup}>
          Create Admin Account
        </button>
      </div>
    </div>
  );
}
