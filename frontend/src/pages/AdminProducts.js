import { useEffect, useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const emptyForm = { name: "", description: "", price: "", image_url: "", category: "", stock: "" };
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending: "var(--forest)", Processing: "#3b82f6",
  Shipped: "var(--forest2)", Delivered: "#166534", Cancelled: "var(--red)"
};

function AdminProducts() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/shop");
  }, [user, navigate]);

  useEffect(() => {
    fetchMyProducts();
    fetchMyOrders();
  }, []);

  // Only fetch THIS admin's products
  const fetchMyProducts = async () => {
    try {
      const res = await API.get("/admin/my-products");
      setProducts(res.data);
    } catch {}
  };

  // Only fetch orders containing this admin's products
  const fetchMyOrders = async () => {
    try {
      const res = await API.get("/admin/orders");
      setOrders(res.data);
    } catch {}
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      if (editingId) {
        await API.put(`/products/${editingId}`, payload);
        toast("Plant updated successfully 🌿", "success");
      } else {
        await API.post("/products/", payload);
        toast("New plant added! 🌱", "success");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchMyProducts();
    } catch (err) {
      toast(err.response?.data?.detail || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name, description: product.description,
      price: String(product.price), image_url: product.image_url,
      category: product.category, stock: String(product.stock)
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this plant from the store?")) return;
    try {
      await API.delete(`/products/${id}`);
      toast("Plant removed", "info");
      fetchMyProducts();
    } catch (err) {
      toast(err.response?.data?.detail || "Delete failed", "error");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, null, { params: { status } });
      toast("Order status updated", "success");
      fetchMyOrders();
    } catch (err) {
      toast(err.response?.data?.detail || "Failed to update status", "error");
    }
  };

  const formFields = [
    { name: "name", label: "Plant Name", placeholder: "e.g. Monstera Deliciosa" },
    { name: "description", label: "Description", placeholder: "Brief plant description" },
    { name: "price", label: "Price (₹)", placeholder: "e.g. 799", type: "number" },
    { name: "image_url", label: "Image URL", placeholder: "https://…" },
    { name: "category", label: "Category", placeholder: "e.g. Indoor, Outdoor, Succulents" },
    { name: "stock", label: "Stock Quantity", placeholder: "e.g. 25", type: "number" },
  ];

  return (
    <div className="page">
      <div className="container">
        <div style={{ padding: "48px 0 24px" }}>
          {/* Header with admin identity */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <h2 className="page-heading">My Admin Dashboard 🌿</h2>
              <p className="page-sub">
                Logged in as <strong style={{ color: "var(--forest)" }}>{user?.name}</strong> — you can only manage your own plants and orders.
              </p>
            </div>
            <div style={{
              background: "var(--bg2)", border: "1.5px solid var(--border)",
              borderRadius: 12, padding: "12px 20px", textAlign: "right", fontSize: 13
            }}>
              <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>YOUR STORE</div>
              <div style={{ color: "var(--forest)", fontWeight: 600 }}>{products.length} Plants</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{orders.length} Orders</div>
            </div>
          </div>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${tab === "products" ? "active" : ""}`}
              onClick={() => setTab("products")}
            >🌱 My Plants ({products.length})</button>
            <button
              className={`admin-tab ${tab === "orders" ? "active" : ""}`}
              onClick={() => setTab("orders")}
            >📦 My Orders ({orders.length})</button>
          </div>
        </div>

        {/* ── Products tab ── */}
        {tab === "products" && (
          <div className="admin-layout">
            {/* Add / Edit form */}
            <div className="admin-form-card">
              <h3 className="admin-form-title">
                {editingId ? "✏️ Edit Plant" : "🌱 Add New Plant"}
              </h3>
              <form onSubmit={handleSubmit}>
                {formFields.map(f => (
                  <div className="form-group" key={f.name}>
                    <label className="form-label">{f.label}</label>
                    <input
                      className="form-input"
                      name={f.name}
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button className="btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>
                    {loading ? "Saving…" : editingId ? "Update Plant" : "Add Plant 🌿"}
                  </button>
                  {editingId && (
                    <button className="btn-ghost" type="button"
                      onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Products table */}
            <div>
              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🪴</div>
                  <h3 className="empty-title">No plants yet</h3>
                  <p className="empty-sub">Add your first plant using the form.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Plant</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {p.image_url ? (
                                <img className="admin-img-thumb" src={p.image_url} alt={p.name}
                                  onError={(e) => { e.target.style.display = "none"; }} />
                              ) : (
                                <div className="admin-img-thumb" style={{
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: "var(--bg2)", fontSize: 20
                                }}>🪴</div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500, color: "var(--text)" }}>{p.name}</div>
                                <div style={{ color: "var(--muted)", fontSize: 11 }}>
                                  {p.description?.slice(0, 38)}{(p.description?.length || 0) > 38 ? "…" : ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ color: "var(--forest)", fontSize: 12, fontWeight: 500 }}>{p.category}</span></td>
                          <td style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
                            ₹{p.price.toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span style={{
                              color: p.stock === 0 ? "var(--red)" : p.stock <= 5 ? "#d97706" : "var(--forest)",
                              fontWeight: 500
                            }}>{p.stock}</span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button className="btn-edit" onClick={() => handleEdit(p)}>Edit</button>
                              <button className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Orders tab ── */}
        {tab === "orders" && (
          <div style={{ paddingBottom: 60 }}>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3 className="empty-title">No orders yet</h3>
                <p className="empty-sub">Orders for your plants will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {orders.map((o, i) => (
                  <div key={o.order_id} style={{
                    background: "var(--white)", border: "1.5px solid var(--border)",
                    borderRadius: 14, overflow: "hidden",
                    transition: "border-color 0.2s",
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`
                  }}>
                    {/* Order header row */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 140px 120px 160px 100px",
                      alignItems: "center", gap: 16,
                      padding: "18px 24px",
                      cursor: "pointer"
                    }} onClick={() => setExpandedOrder(expandedOrder === o.order_id ? null : o.order_id)}>

                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--muted)" }}>
                        #{o.order_id}
                      </div>

                      <div>
                        <div style={{ fontWeight: 500, color: "var(--text)", fontSize: 14 }}>{o.user_name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{o.user_email}</div>
                      </div>

                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--text)" }}>
                        ₹{o.total_amount.toLocaleString("en-IN")}
                      </div>

                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>

                      {/* Status dropdown — this admin can change it */}
                      <select
                        value={o.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                        style={{
                          background: "var(--bg)",
                          border: "1.5px solid var(--border)",
                          color: STATUS_COLORS[o.status] || "var(--text)",
                          padding: "6px 12px", borderRadius: "20px",
                          fontSize: 12, cursor: "pointer", outline: "none",
                          fontFamily: "'Jost', sans-serif", fontWeight: 500,
                        }}
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <div style={{ color: "var(--muted)", fontSize: 18, textAlign: "right" }}>
                        {expandedOrder === o.order_id ? "▲" : "▼"}
                      </div>
                    </div>

                    {/* Expanded items — only this admin's products */}
                    {expandedOrder === o.order_id && (
                      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg)", padding: "16px 24px" }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                          Items from your store
                        </div>
                        {o.items.map((item, idx) => (
                          <div key={idx} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0", borderBottom: idx < o.items.length - 1 ? "1px solid var(--border)" : "none"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 18 }}>🌿</span>
                              <div>
                                <div style={{ fontWeight: 500, color: "var(--text)", fontSize: 14 }}>{item.product_name}</div>
                                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                                  Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--text)" }}>
                              ₹{item.item_total.toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))}
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          marginTop: 14, paddingTop: 14, borderTop: "1.5px solid var(--border)",
                          fontFamily: "'Playfair Display', serif", fontSize: 17, color: "var(--text)"
                        }}>
                          <span>Your portion total</span>
                          <span>₹{o.total_amount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;