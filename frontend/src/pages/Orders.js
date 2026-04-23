import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

function statusClass(status) {
  const map = {
    Pending: "status-pending", Processing: "status-processing",
    Shipped: "status-shipped", Delivered: "status-delivered", Cancelled: "status-cancelled"
  };
  return `status-badge ${map[status] || "status-pending"}`;
}

function OrderDetailModal({ order, onClose }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    API.get(`/orders/${order.order_id}`).then(r => setDetail(r.data)).catch(() => {});
  }, [order.order_id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400 }}>
              Order #{order.order_id}
            </h3>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span className={statusClass(order.status)}>{order.status}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(order.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!detail ? (
          <div className="spinner" />
        ) : (
          <>
            {detail.items.map((item, i) => (
              <div key={i} className="modal-item">
                <div>
                  <div className="modal-item-name">🌿 {item.product_name}</div>
                  <div className="modal-item-meta">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each</div>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17 }}>
                  ₹{item.item_total.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
            <div className="modal-total">
              <span>Total</span>
              <span>₹{detail.total_amount.toLocaleString("en-IN")}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get("/orders/")
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading-full"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="orders-list">
          <h2 className="page-heading">My Orders 🌿</h2>
          <p className="page-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🪴</div>
              <h3 className="empty-title">No orders yet</h3>
              <p className="empty-sub">Start your plant journey today!</p>
              <Link to="/shop"><button className="btn-primary">Shop Plants</button></Link>
            </div>
          ) : (
            orders.map((order, i) => (
              <div key={order.order_id} className="order-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="order-id-box">
                  <span>Order</span>
                  #{order.order_id}
                </div>
                <div>
                  <div className="order-date">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="order-amount">₹{order.total_amount.toLocaleString("en-IN")}</div>
                <span className={statusClass(order.status)}>{order.status}</span>
                <button className="detail-btn" onClick={() => setSelected(order)}>View Details</button>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default Orders;