import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import FloatingLeaves from "../components/FloatingLeaves";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.name.split(" ")[0]}! 🌿`, "success");
      navigate(user.role === "admin" ? "/admin" : "/shop");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ position: "relative" }}>
      <FloatingLeaves />

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-leaf">🌿</span> PlantO
        </div>
        <p className="auth-tagline">Your green sanctuary starts here. Sign in and explore hundreds of beautiful plants.</p>
        <div className="auth-plant-big"></div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🛒</div>
            <span>Easy ordering, fast checkout</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📦</div>
            <span>Track your orders in real time</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">❤️</div>
            <span>Save your favourite plants</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your PlantO account</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input" type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input" type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="form-submit" type="submit" disabled={loading}>
              {loading ? "Signing In…" : "Sign In 🌿"}
            </button>
          </form>

          <div className="form-footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;