import { createContext, useCallback, useEffect, useRef, useState } from 'react';

import { loadArray } from '../lib/storage';
import { checkCart } from '../services/shop.service';

const CartContext = createContext(null);

const sameLine = (a, b) => a.productId === b.productId && a.size === b.size && a.color === b.color;

// Never more than what is in stock (when known), never less than 1.
const clampQty = (qty, stock) => Math.max(1, Math.min(qty, Number.isFinite(stock) ? stock : 99, 99));

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => loadArray('cart'));
  const [refreshing, setRefreshing] = useState(false);
  const itemsRef = useRef(cartItems);
  itemsRef.current = cartItems;

  // Save cart whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch {
      // storage full or blocked: the cart still works for this visit
    }
  }, [cartItems]);

  // Add product to cart. Returns { added, capped } so the page can tell the customer if stock ran out.
  const addToCart = (product, quantity = 1) => {
    let result = { added: quantity, capped: false };
    setCartItems((prev) => {
      const existing = prev.find((item) => sameLine(item, product));
      const stock = Number.isFinite(product.stock) ? product.stock : existing?.stock;
      if (existing) {
        const next = clampQty(existing.quantity + quantity, stock);
        result = { added: next - existing.quantity, capped: next < existing.quantity + quantity };
        return prev.map((item) => (sameLine(item, product) ? { ...item, ...product, quantity: next, available: true } : item));
      }
      const next = clampQty(quantity, stock);
      result = { added: next, capped: next < quantity };
      return [...prev, { ...product, quantity: next, available: true }];
    });
    return result;
  };

  const removeFromCart = (productId, size, color) => {
    setCartItems((prev) => prev.filter((item) => !sameLine(item, { productId, size, color })));
  };

  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        sameLine(item, { productId, size, color }) ? { ...item, quantity: clampQty(quantity, item.stock) } : item,
      ),
    );
  };

  const clearCart = () => setCartItems([]);

  // Gets the latest price and stock for everything in the cart.
  // Returns a list of messages about anything that changed.
  const refreshCart = useCallback(async () => {
    const ids = [...new Set(itemsRef.current.map((i) => i.productId))];
    if (!ids.length) return [];
    setRefreshing(true);
    try {
      const { products } = await checkCart(ids);
      const byId = new Map(products.map((p) => [String(p.productId), p]));
      const notes = [];
      setCartItems(
        itemsRef.current.map((item) => {
          const p = byId.get(String(item.productId));
          if (!p || !p.available) {
            if (item.available !== false) notes.push(`${item.name} is no longer available.`);
            return { ...item, available: false, stock: 0 };
          }
          if (p.price !== item.price) notes.push(`The price of ${p.name} changed to KSh ${p.price.toLocaleString()}.`);
          const quantity = Math.min(item.quantity, p.stock);
          if (quantity < item.quantity) notes.push(`Only ${p.stock} of ${p.name} left — quantity updated.`);
          return {
            ...item, name: p.name, slug: p.slug, price: p.price, compareAtPrice: p.compareAtPrice,
            stock: p.stock, image: p.image || item.image, quantity: Math.max(1, quantity), available: true,
          };
        }),
      );
      return notes;
    } catch {
      return [];
    } finally {
      setRefreshing(false);
    }
  }, []);

  const available = cartItems.filter((i) => i.available !== false);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = available.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartSavings = available.reduce(
    (total, item) => total + (item.compareAtPrice > item.price ? (item.compareAtPrice - item.price) * item.quantity : 0),
    0,
  );
  const hasUnavailable = cartItems.some((i) => i.available === false);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    cartSavings,
    hasUnavailable,
    refreshing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
