import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

import useWishlist from '../../hooks/useWishlist';
import { ksh } from '../../lib/format';
import { Stars } from './Stars';

const ProductItem = ({ product }) => {
  const { slug, images, name, price, compareAtPrice, category, ratingAverage, ratingCount, stock } = product;
  const { toggleWishlist, isInWishlist } = useWishlist();

  const saved = isInWishlist(product._id);
  const onSale = compareAtPrice > price;
  const discount = onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  const soldOut = stock !== undefined && stock <= 0;
  const fewLeft = !soldOut && stock !== undefined && stock <= (product.lowStockThreshold ?? 5);

  const handleWishlist = (e) => {
    // Prevent the parent Link from opening the product page
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/product/${slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden bg-gray-100">
        <img
          src={images?.[0]?.url}
          alt={name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${soldOut ? 'opacity-60' : ''}`}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale && <span className="bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">−{discount}%</span>}
          {soldOut && <span className="bg-gray-900 px-2 py-1 text-[11px] font-medium text-white">Sold out</span>}
          {fewLeft && <span className="bg-white px-2 py-1 text-[11px] font-medium text-amber-700">Only {stock} left</span>}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black ${
            saved ? 'text-black opacity-100' : 'text-gray-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          aria-label={saved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        >
          <Heart size={17} strokeWidth={1.7} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="pt-3">
        {category && <p className="mb-1 text-xs text-gray-400">{category}</p>}

        <h3 className="text-sm font-medium leading-5 text-gray-800 transition-colors group-hover:text-black">{name}</h3>

        {ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <Stars value={ratingAverage} size={12} />
            <span className="text-[11px] text-gray-400">({ratingCount})</span>
          </div>
        )}

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={`text-sm font-semibold ${onSale ? 'text-red-600' : 'text-gray-950'}`}>{ksh(price)}</span>
          {onSale && <span className="text-xs text-gray-400 line-through">{ksh(compareAtPrice)}</span>}
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;
