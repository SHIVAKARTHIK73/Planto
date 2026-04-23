import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Cart() {
  const { cartItems, total, updateQuantity, removeFromCart, fetchCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleQty = async (productId, newQty, stock) => {
    if (newQty < 1) {
      await removeFromCart(productId);
      toast("Item removed", "info");
      return;
    }
    if (newQty > stock) { toast(`Only ${stock} in stock`, "error"); return; }
    try {
      await updateQuantity(productId, newQty);
    } catch (err) {
      toast(err.response?.data?.detail || "Update failed", "error");
    }
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    toast("Plant removed from cart", "info");
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await API.post("/orders/");
      await fetchCart();
      toast("Order placed! Your plants are on their way 🌿", "success");
      setTimeout(() => navigate("/orders"), 1400);
    } catch (err) {
      toast(err.response?.data?.detail || "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  const shipping = total > 999 ? 0 : 99;
  const grandTotal = total + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state" style={{ paddingTop: 100 }}>
            <div className="empty-icon">🛒</div>
            <h3 className="empty-title">Your cart is empty</h3>
            <p className="empty-sub">Add some beautiful plants to get started!</p>
            <Link to="/shop"><button className="btn-primary">Browse Plants 🌿</button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="cart-layout">
          <div>
            <h2 className="page-heading">Your Cart 🛒</h2>
            <p className="page-sub">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart</p>

            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.product_id} className="cart-item">
                  {item.image_url ? (
                    <img className="cart-item-img" src={item.image_url} alt={item.name}
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="cart-item-img-placeholder">🪴</div>
                  )}

                  <div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">₹{item.price.toLocaleString("en-IN")} each</div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => handleQty(item.product_id, item.quantity - 1, item.stock)}>−</button>
                      <span className="qty-num">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => handleQty(item.product_id, item.quantity + 1, item.stock)}>+</button>
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        style={{ marginLeft: 10, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                      >Remove</button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    ₹{item.item_total.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>
                {shipping === 0
                  ? <span style={{ color: "var(--forest)", fontWeight: 500 }}>Free 🎉</span>
                  : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <div style={{ fontSize: 11, color: "var(--muted)", padding: "4px 0 8px", borderBottom: "1px solid var(--border)" }}>
                🌿 Add ₹{(999 - total).toFixed(0)} more for free delivery
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            <button className="place-order-btn" onClick={placeOrder} disabled={placing}>
              {placing ? "Placing Order…" : "Place Order 🌿"}
            </button>

            <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
              🔒 Secure checkout · 🌱 Eco-friendly packaging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;