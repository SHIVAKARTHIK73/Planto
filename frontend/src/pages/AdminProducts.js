import { useEffect, useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const emptyForm = { name: "", description: "", price: "", image_url: "", category: "", stock: "" };

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function AdminProducts() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    const res = await API.get("/products/");
    setProducts(res.data.products);
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/admin/orders");
      setOrders(res.data);
    } catch {}
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      if (editingId) {
        await API.put(`/products/${editingId}`, payload);
        toast("Product updated", "success");
      } else {
        await API.post("/products/", payload);
        toast("Product added", "success");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.detail || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name, description: product.description, price: String(product.price),
      image_url: product.image_url, category: product.category, stock: String(product.stock)
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      toast("Product deleted", "info");
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.detail || "Delete failed", "error");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, null, { params: { status } });
      toast("Order status updated", "success");
      fetchOrders();
    } catch {
      toast("Failed to update status", "error");
    }
  };

  const statusColors = { Pending: "var(--gold)", Processing: "#60a5fa", Shipped: "#a78bfa", Delivered: "var(--green)", Cancelled: "var(--red)" };

  return (
    <div className="page">
      <div className="container">
        <div style={{ padding: "48px 0 24px" }}>
          <h2 className="page-heading">Admin Panel</h2>
          <p className="page-sub">Manage products and orders</p>

          <div className="admin-tabs">
            <button className={`admin-tab ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>
              Products ({products.length})
            </button>
            <button className={`admin-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
              Orders ({orders.length})
            </button>
          </div>
        </div>

        {tab === "products" && (
          <div className="admin-layout">
            {/* Form */}
            <div className="admin-form-card">
              <h3 className="admin-form-title">{editingId ? "Edit Product" : "Add New Product"}</h3>

              <form onSubmit={handleSubmit}>
                {[
                  { name: "name", label: "Product Name", placeholder: "e.g. Silk Cushion Cover" },
                  { name: "description", label: "Description", placeholder: "Brief product description" },
                  { name: "price", label: "Price (₹)", placeholder: "e.g. 1299", type: "number" },
                  { name: "image_url", label: "Image URL", placeholder: "https://…" },
                  { name: "category", label: "Category", placeholder: "e.g. Home, Fashion, Electronics" },
                  { name: "stock", label: "Stock Quantity", placeholder: "e.g. 50", type: "number" },
                ].map(f => (
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
                  <button className="btn-gold" type="submit" style={{ flex: 1 }} disabled={loading}>
                    {loading ? "Saving…" : editingId ? "Update Product" : "Add Product"}
                  </button>
                  {editingId && (
                    <button className="btn-ghost" type="button" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product table */}
            <div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
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
                            {p.image_url
                              ? <img className="admin-img-thumb" src={p.image_url} alt={p.name} onError={e => e.target.style.display = "none"} />
                              : <div className="admin-img-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg3)", color: "var(--muted)" }}>◆</div>
                            }
                            <div>
                              <div style={{ fontWeight: 500 }}>{p.name}</div>
                              <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.description.slice(0, 40)}{p.description.length > 40 ? "…" : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ color: "var(--gold)", fontSize: 12 }}>{p.category}</span></td>
                        <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>₹{p.price.toLocaleString("en-IN")}</td>
                        <td>
                          <span style={{ color: p.stock === 0 ? "var(--red)" : p.stock <= 5 ? "var(--gold)" : "var(--green)" }}>
                            {p.stock}
                          </span>
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
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div style={{ paddingBottom: 48 }}>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◇</div>
                <h3 className="empty-title">No orders yet</h3>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.order_id}>
                        <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--muted)" }}>#{o.order_id}</td>
                        <td style={{ fontWeight: 500 }}>{o.user_name}</td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.user_email}</td>
                        <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>₹{o.total_amount.toLocaleString("en-IN")}</td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>
                          {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={e => handleStatusChange(o.order_id, e.target.value)}
                            style={{
                              background: "var(--bg3)",
                              border: "1px solid var(--border)",
                              color: statusColors[o.status] || "var(--text)",
                              padding: "6px 10px",
                              borderRadius: "var(--radius)",
                              fontSize: 12,
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;