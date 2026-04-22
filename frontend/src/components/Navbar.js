import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
           PLA<span>NTO</span>
      </Link>

      <div className="navbar-links">
        <Link className={isActive("/")} to="/">Shop</Link>

        {user && (
          <>
            <Link className={isActive("/orders")} to="/orders">Orders</Link>
            {user.role === "admin" && (
              <Link className={isActive("/admin")} to="/admin">Admin</Link>
            )}
          </>
        )}

        {user ? (
          <>
            <Link to="/cart" className="nav-cart-btn" style={{ textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Cart
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>
            <button className="btn-ghost" onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link className="nav-link" to="/login">Sign In</Link>
            <Link to="/register">
              <button className="btn-gold">Join</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;