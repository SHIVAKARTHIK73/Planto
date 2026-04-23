import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import FloatingLeaves from "../components/FloatingLeaves";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/login");
  };

  return (
    <div className="auth-page" style={{ position: "relative" }}>
      <FloatingLeaves />

      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="success-icon">🌱</div>
            <h3 className="success-title">Welcome to PlantO!</h3>
            <p className="success-sub">
              Your account has been created successfully.<br />
              Sign in to start exploring our green collection.
            </p>
            <button className="btn-primary" style={{ width: "100%", padding: "14px" }} onClick={handleSuccessClose}>
              Go to Sign In →
            </button>
          </div>
        </div>
      )}

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-leaf">🌿</span> PlantO
        </div>
        <p className="auth-tagline">Your one-stop destination for beautiful, healthy indoor plants.</p>
        <div className="auth-plant-big"></div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🌱</div>
            <span>500+ plant varieties to choose from</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🚚</div>
            <span>Same-day delivery in your city</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">💚</div>
            <span>Expert care guides with every plant</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">♻️</div>
            <span>Eco-friendly, sustainable packaging</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Join thousands of plant lovers</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input" name="name"
                placeholder="Your full name"
                value={form.name} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input" name="email" type="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input" name="password" type="password"
                placeholder="Minimum 6 characters"
                value={form.password} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input" name="confirm" type="password"
                placeholder="Repeat your password"
                value={form.confirm} onChange={handleChange} required
              />
            </div>
            <button className="form-submit" type="submit" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account 🌿"}
            </button>
          </form>

          <div className="form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;