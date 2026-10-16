import { useState } from "react";
import "./App.css";
import { getToken, getSavedAdmin, logout } from "./api";
import AdminWelcome from "./pages/AdminWelcome";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [page, setPage] = useState(
    getToken() && getSavedAdmin() ? "dashboard" : "welcome"
  );

  const handleLogout = () => {
    logout();
    setPage("login");
  };

  if (page === "dashboard") return <AdminDashboard onLogout={handleLogout} />;
  if (page === "login")
    return <AdminLogin onSuccess={() => setPage("dashboard")} onSignup={() => setPage("signup")} />;
  if (page === "signup")
    return <AdminSignup onDone={() => setPage("login")} onLogin={() => setPage("login")} />;

  return <AdminWelcome onLogin={() => setPage("login")} onSignup={() => setPage("signup")} />;
}
