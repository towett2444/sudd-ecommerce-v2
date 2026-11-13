import { createContext, useEffect, useState } from 'react';

import { loadArray } from '../lib/storage';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => loadArray('wishlist'));

  // Save wishlist whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Add product to wishlist
  const addToWishlist = (product) => {
    setWishlistItems((prev) => {
      const alreadyExists = prev.some((item) => item._id === product._id);

      if (alreadyExists) {
        return prev;
      }

      return [...prev, product];
    });
  };

  // Remove product from wishlist
  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
  };

  // Check whether product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  // Add or remove product
  const toggleWishlist = (product) => {
    const exists = wishlistItems.some((item) => item._id === product._id);

    if (exists) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  // Clear entire wishlist
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  // Total wishlist items
  const wishlistCount = wishlistItems.length;

  const value = {
    wishlistItems,
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
