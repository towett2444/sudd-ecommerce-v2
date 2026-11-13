import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Heart, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import ProductItem from '../../components/public/ProductItem';
import Reviews from '../../components/public/Reviews';
import { Stars } from '../../components/public/Stars';
import store from '../../config/store';
import useCart from '../../hooks/useCart';
import useWishlist from '../../hooks/useWishlist';
import { ksh } from '../../lib/format';
import { getProductBySlug } from '../../services/product.service';

const Product = () => {
  const { slug } = useParams();
  const { addToCart, cartItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    getProductBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setProduct(data.product);
        setRelated(data.related || []);
        setSelectedImage(data.product.images?.[0]?.url || '');
        setSelectedSize(data.product.sizes?.length === 1 ? data.product.sizes[0] : '');
        setSelectedColor(data.product.colors?.length === 1 ? data.product.colors[0] : '');
        setQuantity(1);
      })
      .catch((e) => {
        if (!alive) return;
        setProduct(null);
        setError(e.response?.data?.message || 'Failed to fetch product.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-125 items-center justify-center">
        <p className="text-sm text-gray-500">Loading product…</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-125 flex-col items-center justify-center py-20 text-center">
        <ShoppingBag size={32} strokeWidth={1.4} className="text-gray-400" />
        <h1 className="mt-5 text-xl font-medium text-gray-950">Product not found</h1>
        <p className="mt-2 text-sm text-gray-500">{error || 'This product may no longer be available.'}</p>
        <Link to="/collection" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
          <ArrowLeft size={16} /> Back to shop
        </Link>
      </main>
    );
  }

  const saved = isInWishlist(product._id);
  const onSale = product.compareAtPrice > product.price;
  const soldOut = product.stock <= 0;
  const inCart = cartItems
    .filter((i) => i.productId === product._id && i.size === (selectedSize || null) && i.color === (selectedColor || null))
    .reduce((s, i) => s + i.quantity, 0);
  const canAdd = Math.max(0, product.stock - inCart);

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) return toast.error('Please select a size.');
    if (product.colors?.length && !selectedColor) return toast.error('Please select a color.');
    if (canAdd <= 0) return toast.error(`You already have all ${product.stock} available in your cart.`);

    const { added, capped } = addToCart(
      {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        size: selectedSize || null,
        color: selectedColor || null,
      },
      Math.min(quantity, canAdd),
    );
    if (capped) toast(`Only ${product.stock} available — your cart has the maximum.`);
    else toast.success(`${added} × ${product.name} added to cart.`);
    setQuantity(1);
  };

  return (
    <main className="py-8 sm:py-10">
      <nav className="mb-8 flex items-center gap-2 overflow-hidden text-xs text-gray-400" aria-label="Breadcrumb">
        <Link to="/" className="shrink-0 hover:text-black">Home</Link>
        <ChevronRight size={13} />
        <Link to={`/collection?category=${encodeURIComponent(product.category)}`} className="shrink-0 hover:text-black">{product.category}</Link>
        <ChevronRight size={13} />
        <span className="truncate text-gray-600">{product.name}</span>
      </nav>

      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {product.images?.length > 1 && (
            <div className="flex w-full gap-2 overflow-x-auto sm:w-[18.7%] sm:flex-col">
              {product.images.map((image, index) => (
                <button type="button" key={image.fileId} onClick={() => setSelectedImage(image.url)}
                  className={`w-[24%] shrink-0 cursor-pointer overflow-hidden border sm:w-full ${selectedImage === image.url ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                  aria-label={`View image ${index + 1}`}>
                  <img src={image.url} alt="" className="aspect-4/5 w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className={`relative ${product.images?.length > 1 ? 'w-full sm:w-[80%]' : 'w-full'}`}>
            <img src={selectedImage || product.images?.[0]?.url} alt={product.name} className="aspect-4/5 w-full bg-gray-100 object-cover" />
            {onSale && (
              <span className="absolute left-4 top-4 bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                Save {product.discountPercent || Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
              </span>
            )}
            <button type="button" onClick={() => toggleWishlist(product)}
              className={`absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white ${saved ? 'text-black' : 'text-gray-700'}`}
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}>
              <Heart size={18} strokeWidth={1.7} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="lg:py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
            {product.category} · {product.subCategory}
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">{product.name}</h1>

          <a href="#reviews" className="mt-4 flex items-center gap-2 text-xs text-gray-500 hover:text-black">
            <Stars value={product.ratingAverage} />
            {product.ratingCount > 0
              ? `${product.ratingAverage.toFixed(1)} · ${product.ratingCount} review${product.ratingCount === 1 ? '' : 's'}`
              : 'No reviews yet — be the first'}
          </a>

          <div className="mt-7 flex items-baseline gap-3">
            <span className={`text-2xl font-semibold ${onSale ? 'text-red-600' : 'text-gray-950'}`}>{ksh(product.price)}</span>
            {onSale && (
              <>
                <span className="text-base text-gray-400 line-through">{ksh(product.compareAtPrice)}</span>
                <span className="text-sm font-medium text-red-600">You save {ksh(product.compareAtPrice - product.price)}</span>
              </>
            )}
          </div>

          <p className="mt-5 max-w-lg whitespace-pre-line text-sm leading-7 text-gray-500">{product.description}</p>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium">
            {soldOut ? (
              <span className="text-gray-500">Sold out — check back soon</span>
            ) : product.stock <= (product.lowStockThreshold ?? 5) ? (
              <span className="text-amber-700">Hurry, only {product.stock} left in stock</span>
            ) : (
              <span className="flex items-center gap-2 text-green-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50"><Check size={12} /></span>
                In stock ({product.stock} available)
              </span>
            )}
          </div>

          {product.sizes?.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Size {selectedSize && <span className="ml-2 font-normal text-gray-400">{selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button type="button" key={size} onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size}
                    className={`min-w-12 cursor-pointer border px-4 py-2.5 text-sm ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Color {selectedColor && <span className="ml-2 font-normal text-gray-400">{selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button type="button" key={color} onClick={() => setSelectedColor(color)} aria-pressed={selectedColor === color}
                    className={`cursor-pointer border px-4 py-2 text-sm ${selectedColor === color ? 'border-black text-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex max-w-lg gap-3">
            <div className="flex h-[52px] items-center border border-gray-200">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1 || soldOut}
                className="flex h-full w-11 cursor-pointer items-center justify-center text-gray-600 disabled:opacity-30" aria-label="Decrease quantity">
                <Minus size={15} />
              </button>
              <span className="w-8 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(canAdd || 1, q + 1))} disabled={soldOut || quantity >= canAdd}
                className="flex h-full w-11 cursor-pointer items-center justify-center text-gray-600 disabled:opacity-30" aria-label="Increase quantity">
                <Plus size={15} />
              </button>
            </div>
            <button type="button" onClick={handleAddToCart} disabled={soldOut}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 bg-black px-6 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
              <ShoppingBag size={18} strokeWidth={1.7} />
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
          {inCart > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              {inCart} in your cart · <Link to="/cart" className="underline">view cart</Link>
            </p>
          )}

          <div className="mt-8 max-w-lg divide-y divide-gray-100 border-y border-gray-100">
            <Benefit icon={Truck} title="Delivery across Kenya" text="Nairobi in 1–2 days. Free over KSh 10,000. Fee shown at checkout." />
            <Benefit icon={RotateCcw} title="Easy returns" text={`Returns accepted within ${store.returnsDays} days.`} />
            <Benefit icon={ShieldCheck} title="Secure payment" text="M-Pesa, Visa/Mastercard or cash on delivery." />
          </div>
        </div>
      </section>

      <Reviews product={product} onRatingChange={(ratingAverage, ratingCount) => setProduct((p) => ({ ...p, ratingAverage, ratingCount }))} />

      {related.length > 0 && (
        <section className="mt-20 border-t border-gray-200 pt-12">
          <h2 className="mb-8 text-2xl font-medium tracking-tight text-gray-950">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {related.slice(0, 4).map((p) => <ProductItem key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
};

const Benefit = ({ icon: Icon, title, text }) => (
  <div className="flex items-center gap-4 py-4">
    <Icon size={19} strokeWidth={1.5} className="shrink-0 text-gray-600" />
    <div>
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="mt-0.5 text-xs text-gray-400">{text}</p>
    </div>
  </div>
);

export default Product;
