import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

function statusClass(status) {
  const map = { Pending: "status-pending", Shipped: "status-shipped", Delivered: "status-delivered", Cancelled: "status-cancelled" };
  return `status-badge ${map[status] || "status-pending"}`;
}

function OrderDetailModal({ order, onClose }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    API.get(`/orders/${order.order_id}`).then(r => setDetail(r.data)).catch(() => {});
  }, [order.order_id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300 }}>
              Order #{order.order_id}
            </h3>
            <span className={statusClass(order.status)}>{order.status}</span>
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
                  <div className="modal-item-name">{item.product_name}</div>
                  <div className="modal-item-meta">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each</div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                  ₹{item.item_total.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
            <div className="modal-total">
              <span>Total</span>
              <span>₹{detail.total_amount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Placed on {new Date(detail.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
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
          <h2 className="page-heading">My Orders</h2>
          <p className="page-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <h3 className="empty-title">No orders yet</h3>
              <p className="empty-sub">Your order history will appear here once you make a purchase.</p>
              <Link to="/"><button className="btn-gold">Start Shopping</button></Link>
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
                    {new Date(order.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
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