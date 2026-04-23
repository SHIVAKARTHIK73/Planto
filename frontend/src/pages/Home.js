import { Link } from "react-router-dom";
import FloatingLeaves from "../components/FloatingLeaves";

function Home() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <FloatingLeaves />

      {/* Simple top nav for landing */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "68px",
        background: "rgba(247,250,248,0.90)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>🌿</span> PlantO
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/login">
            <button className="btn-ghost">Sign In</button>
          </Link>
          <Link to="/register">
            <button className="btn-primary">Get Started</button>
          </Link>
        </div>
      </nav>

      <div className="landing" style={{ paddingTop: 68, position: "relative", zIndex: 1 }}>
        {/* Left */}
        <div className="landing-left">
          <div className="landing-eyebrow">
            🌱 <span>Fresh Plants, Delivered to You</span>
          </div>

          <h1 className="landing-title">
            Bring Nature<br />
            <em>Inside Your</em><br />
            Home
          </h1>

          <p className="landing-sub">
            Discover hand-picked indoor plants, rare specimens, and everything you need to create your perfect green sanctuary. Same-day delivery available.
          </p>

          <div className="landing-actions">
            <Link to="/register">
              <button className="btn-primary" style={{ padding: "13px 32px", fontSize: 14 }}>
                Start Shopping 🛍️
              </button>
            </Link>
            <Link to="/login">
              <button className="btn-outline" style={{ padding: "12px 28px", fontSize: 14 }}>
                Sign In
              </button>
            </Link>
          </div>

          <div className="landing-stats">
            <div>
              <div className="stat-num">500+</div>
              <div className="stat-label">Plant varieties</div>
            </div>
            <div>
              <div className="stat-num">12k+</div>
              <div className="stat-label">Happy customers</div>
            </div>
            <div>
              <div className="stat-num">4.9★</div>
              <div className="stat-label">Average rating</div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="landing-right">
          <div className="right-content">
          <div className="plant-illustration">PlantO🍃</div>

          <div className="landing-cards">
            <div className="mini-card">
              <div className="mini-card-icon">🚚</div>
              <div>Free delivery</div>
              <div style={{ opacity: 0.7, fontSize: 10, marginTop: 2 }}>above ₹999</div>
            </div>
            <div className="mini-card">
              <div className="mini-card-icon">🌿</div>
              <div>Healthy plants</div>
              <div style={{ opacity: 0.7, fontSize: 10, marginTop: 2 }}>guaranteed</div>
            </div>
            <div className="mini-card">
              <div className="mini-card-icon">♻️</div>
              <div>Eco packaging</div>
              <div style={{ opacity: 0.7, fontSize: 10, marginTop: 2 }}>100% natural</div>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;