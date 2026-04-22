import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

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

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    setAdding(a => ({ ...a, [productId]: true }));
    try {
      await addToCart(productId);
      toast("Added to cart", "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Could not add to cart", "error");
    } finally {
      setAdding(a => ({ ...a, [productId]: false }));
    }
  };

  const getStatusBadge = (stock) => {
    if (stock === 0) return <span className="stock-badge out">Out of Stock</span>;
    if (stock <= 5) return <span className="stock-badge low">Only {stock} left</span>;
    return null;
  };

  const getEmoji = (category) => {
    const map = { Electronics: "⚡", Fashion: "👗", Beauty: "✨", Home: "🏠", Sports: "⚽", Books: "📚", Food: "🍜" };
    return map[category] || "◆";
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="hero">
          <p className="hero-eyebrow">New Collection 2025</p>
          <h1 className="hero-title">Curated for the<br /><em>discerning few</em></h1>
          <p className="hero-sub">Premium goods, thoughtfully selected. Free delivery on orders above ₹999.</p>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className={`filter-chip ${activeCategory === "" ? "active" : ""}`}
            onClick={() => setActiveCategory("")}
          >All</button>
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
            <div className="empty-icon">◇</div>
            <h3 className="empty-title">No products found</h3>
            <p className="empty-sub">Try adjusting your search or filters</p>
            <button className="btn-ghost" onClick={() => { setSearch(""); setActiveCategory(""); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="product-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="product-img-wrap">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="product-img-placeholder">{getEmoji(product.category)}</div>
                  )}
                  {getStatusBadge(product.stock)}
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
    </div>
  );
}

export default Products;