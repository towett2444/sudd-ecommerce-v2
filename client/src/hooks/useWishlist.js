import { useContext } from 'react';

import WishlistContext from '../context/WishlistContext';

const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider.');
  }

  return context;
};

export default useWishlist;
