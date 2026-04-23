import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const PLANT_EMOJIS = ["🪴", "🌵", "🌿", "🌱", "🌳", "🍀", "🎋", "🌺"];

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => navigate("/shop"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) { navigate("/login"); return; }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast(`Added ${quantity} × ${product.name} to cart 🌿`, "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Could not add to cart", "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="page">
      <div className="loading-full"><div className="spinner" /></div>
    </div>
  );

  if (!product) return null;

  const emoji = PLANT_EMOJIS[product.id % PLANT_EMOJIS.length];
  const inStock = product.stock > 0;

  const careItems = [
    { icon: "☀️", label: "Light", value: "Bright indirect light" },
    { icon: "💧", label: "Water", value: "Once a week" },
    { icon: "🌡️", label: "Temp", value: "18°C – 28°C" },
    { icon: "🪴", label: "Pot", value: "Well-draining soil" },
  ];

  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ padding: "28px 0 0", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
          <Link to="/shop" style={{ color: "var(--muted)", textDecoration: "none" }}>Shop</Link>
          <span>›</span>
          <span style={{ color: "var(--forest)" }}>{product.name}</span>
        </div>

        {/* Main layout */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 60, padding: "36px 0 60px", alignItems: "start"
        }}>
          {/* Left — Image */}
          <div>
            <div style={{
              background: "linear-gradient(135deg, var(--bg2), var(--mint))",
              borderRadius: 20, overflow: "hidden",
              border: "1.5px solid var(--border)",
              aspectRatio: "1",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative"
            }}>
              {product.image_url ? (
                <img
                  src={product.image_url} alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <span style={{ fontSize: 100 }}>{emoji}</span>
              )}
              {!inStock && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 20
                }}>
                  <span style={{ color: "white", fontSize: 18, fontWeight: 600, letterSpacing: "0.1em" }}>OUT OF STOCK</span>
                </div>
              )}
            </div>

            {/* Care guide cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
              {careItems.map(c => (
                <div key={c.label} style={{
                  background: "var(--white)", border: "1.5px solid var(--border)",
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  cursor: "default"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--sage)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(88,139,118,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Details */}
          <div>
            {/* Category */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--bg2)", border: "1px solid var(--border)",
              color: "var(--forest)", padding: "5px 14px",
              borderRadius: 20, fontSize: 11, fontWeight: 500,
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16
            }}>
              🌿 {product.category}
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(32px, 4vw, 46px)",
              fontWeight: 400, lineHeight: 1.15,
              color: "var(--text)", marginBottom: 16
            }}>{product.name}</h1>

            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, marginBottom: 28 }}>
              {product.description}
            </p>

            {/* Price + stock */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: "var(--text)" }}>
                <span style={{ fontSize: 20, color: "var(--muted)" }}>₹</span>
                {product.price.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ marginBottom: 32, fontSize: 13 }}>
              {product.stock === 0 ? (
                <span style={{ color: "var(--red)", fontWeight: 500 }}>Out of stock</span>
              ) : product.stock <= 5 ? (
                <span style={{ color: "#d97706", fontWeight: 500 }}>⚠️ Only {product.stock} left in stock</span>
              ) : (
                <span style={{ color: "var(--forest)", fontWeight: 500 }}>✓ In stock ({product.stock} available)</span>
              )}
            </div>

            {/* Quantity + Add */}
            {inStock && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 0,
                  border: "1.5px solid var(--border)", borderRadius: 10, overflow: "hidden"
                }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{
                      width: 44, height: 48, background: "var(--bg)", border: "none",
                      cursor: "pointer", fontSize: 20, color: "var(--forest)",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg)"}
                  >−</button>
                  <div style={{
                    width: 52, textAlign: "center", fontSize: 16,
                    fontWeight: 600, color: "var(--text)", padding: "0 8px",
                    borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)"
                  }}>{quantity}</div>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    style={{
                      width: 44, height: 48, background: "var(--bg)", border: "none",
                      cursor: "pointer", fontSize: 20, color: "var(--forest)",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg)"}
                  >+</button>
                </div>

                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: "14px 24px", fontSize: 14 }}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? "Adding…" : `Add to Cart 🛒`}
                </button>
              </div>
            )}

            {/* Total price preview */}
            {inStock && quantity > 1 && (
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "12px 16px", marginBottom: 24,
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {quantity} plants × ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--forest)" }}>
                  ₹{(product.price * quantity).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {/* Perks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {[
                { icon: "🚚", text: "Free delivery above ₹999" },
                { icon: "🌱", text: "Healthy plant guarantee" },
                { icon: "♻️", text: "Eco-friendly packaging" },
                { icon: "📞", text: "Expert care support included" },
              ].map(p => (
                <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)" }}>
                  <span>{p.icon}</span> {p.text}
                </div>
              ))}
            </div>

            {/* Back link */}
            <div style={{ marginTop: 32 }}>
              <button
                className="btn-ghost"
                onClick={() => navigate("/shop")}
                style={{ fontSize: 13 }}
              >← Back to Shop</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;