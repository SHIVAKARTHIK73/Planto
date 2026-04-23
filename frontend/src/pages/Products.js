import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const PLANT_EMOJIS = ["🪴", "🌵", "🌿", "🌱", "🌳", "🍀", "🎋", "🌺"];

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [adding, setAdding] = useState({});
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeCategory) params.category = activeCategory;
      const res = await API.get("/products/", { params });
      setProducts(res.data.products);
    } catch {
      toast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory]);

  useEffect(() => {
    API.get("/products/categories").then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Add to cart without navigating away
  const handleAddToCart = async (productId, e) => {
    e.stopPropagation(); // prevent card click
    if (!user) { navigate("/login"); return; }
    setAdding(a => ({ ...a, [productId]: true }));
    try {
      await addToCart(productId, 1);
      toast("Added to cart 🌿", "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Could not add to cart", "error");
    } finally {
      setAdding(a => ({ ...a, [productId]: false }));
    }
  };

  // Clicking the card opens product detail
  const handleCardClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getEmoji = (idx) => PLANT_EMOJIS[idx % PLANT_EMOJIS.length];

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="shop-hero">
          <h1 className="shop-hero-title">
            Our Plant <em>Collection</em>
          </h1>
          <p className="shop-hero-sub">
            Hand-picked, healthy plants delivered right to your doorstep. Click any plant for details.
          </p>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search plants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`filter-chip ${activeCategory === "" ? "active" : ""}`}
            onClick={() => setActiveCategory("")}
          >All Plants</button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
            >{cat}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-full"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌵</div>
            <h3 className="empty-title">No plants found</h3>
            <p className="empty-sub">Try adjusting your search or filters</p>
            <button className="btn-outline" onClick={() => { setSearch(""); setActiveCategory(""); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="product-card"
                style={{ animationDelay: `${i * 0.05}s`, cursor: "pointer" }}
                onClick={() => handleCardClick(product.id)}
                title="Click to view details"
              >
                <div className="product-img-wrap">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="product-img-placeholder">{getEmoji(i)}</div>
                  )}
                  {product.stock === 0 && <span className="stock-badge out">Out of Stock</span>}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="stock-badge low">Only {product.stock} left</span>
                  )}
                  {/* "View Details" overlay on hover */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(88,139,118,0.0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.25s",
                    fontSize: 13, color: "white", fontWeight: 500,
                    letterSpacing: "0.05em", opacity: 0,
                    transition: "opacity 0.25s, background 0.25s",
                  }}
                    className="product-hover-overlay"
                  >
                    View Details →
                  </div>
                </div>

                <div className="product-info">
                  <p className="product-category">{product.category}</p>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <div className="product-price">
                      <span>₹</span>{product.price.toLocaleString("en-IN")}
                    </div>
                    <button
                      className="add-btn"
                      onClick={(e) => handleAddToCart(product.id, e)}
                      disabled={product.stock === 0 || adding[product.id]}
                      title={product.stock === 0 ? "Out of stock" : "Add to cart"}
                    >
                      {adding[product.id] ? "…" : "+"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS for hover overlay via style tag */}
      <style>{`
        .product-card:hover .product-hover-overlay {
          opacity: 1 !important;
          background: rgba(88,139,118,0.45) !important;
        }
      `}</style>
    </div>
  );
}

export default Products;