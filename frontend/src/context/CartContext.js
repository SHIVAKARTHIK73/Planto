import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) fetchCart();
    else { setCartItems([]); setTotal(0); }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart/");
      setCartItems(res.data.cart_items);
      setTotal(res.data.total_price);
    } catch {}
  };

  const addToCart = async (productId, quantity = 1) => {
    await API.post("/cart/add", { product_id: productId, quantity });
    await fetchCart();
  };

  const removeFromCart = async (productId) => {
    await API.delete(`/cart/remove/${productId}`);
    await fetchCart();
  };

  const updateQuantity = async (productId, quantity) => {
    await API.put("/cart/update", { product_id: productId, quantity });
    await fetchCart();
  };

  const clearCart = () => { setCartItems([]); setTotal(0); };

  return (
    <CartContext.Provider value={{ cartItems, total, fetchCart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }