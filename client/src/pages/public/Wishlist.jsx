import { Link, useNavigate } from 'react-router-dom';

import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';

import useWishlist from '../../hooks/useWishlist';
import toast from 'react-hot-toast';

import useCart from '../../hooks/useCart';

const Wishlist = () => {
  const navigate = useNavigate();

  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();

  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    const hasSizes = product.sizes?.length > 0;
    const hasColors = product.colors?.length > 0;

    // Product options must be selected first
    if (hasSizes || hasColors) {
      navigate(`/product/${product.slug}`);
      return;
    }

    addToCart({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0]?.url || '',
      size: null,
      color: null,
    });

    toast.success(`${product.name} added to cart.`);
  };

  if (wishlistItems.length === 0) {
    return <EmptyWishlist />;
  }

  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-5 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">
            My wishlist
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">
            Keep track of the products you love and come back to them whenever
            you're ready.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {wishlistItems.map((product) => (
          <WishlistItem
            key={product._id}
            product={product}
            onRemove={removeFromWishlist}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </main>
  );
};

const WishlistItem = ({ product, onRemove, onAddToCart }) => {
  const hasSizes = product.sizes?.length > 0;
  const hasColors = product.colors?.length > 0;
  const hasOptions = hasSizes || hasColors;

  const productUrl = `/product/${product.slug}`;

  return (
    <article className="group">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <Link to={productUrl}>
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove(product._id)}
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-black"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <Trash2 size={16} strokeWidth={1.7} />
        </button>

        {/* Stock */}
        {!product.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-white/95 px-4 py-3 text-center text-xs font-medium text-gray-600 backdrop-blur-sm">
            Out of stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-3">
        <p className="mb-1 text-xs text-gray-400">{product.category}</p>

        <div className="flex items-start justify-between gap-3">
          <Link
            to={productUrl}
            className="text-sm font-medium leading-5 text-gray-800 transition hover:text-black"
          >
            {product.name}
          </Link>

          <p className="shrink-0 text-sm font-medium text-gray-950">
            KSh {Number(product.price).toLocaleString()}
          </p>
        </div>

        {/* Add to cart / choose options */}
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => onAddToCart(product)}
          className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 border border-gray-200 text-xs font-medium text-gray-800 transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        >
          <ShoppingBag size={15} strokeWidth={1.7} />

          {!product.inStock
            ? 'Out of stock'
            : hasOptions
              ? 'Choose options'
              : 'Add to cart'}
        </button>

        {/* Product options */}
        {product.inStock && hasOptions && (
          <Link
            to={productUrl}
            className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400 transition hover:text-black"
          >
            Select options
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </article>
  );
};

const EmptyWishlist = () => {
  return (
    <main className="flex min-h-[600px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Heart size={27} strokeWidth={1.5} className="text-gray-500" />
      </div>

      <h1 className="mt-6 text-xl font-medium text-gray-950">
        Your wishlist is empty
      </h1>

      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
        Save the products you love and they'll appear here for you to find
        later.
      </p>

      <Link
        to="/collection"
        className="group mt-7 inline-flex items-center gap-3 bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        Explore products
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </main>
  );
};

export default Wishlist;
