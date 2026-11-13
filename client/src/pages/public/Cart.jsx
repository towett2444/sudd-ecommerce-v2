import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import useCart from '../../hooks/useCart';
import { ksh } from '../../lib/format';

const FREE_DELIVERY_OVER = 10000;

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, cartSavings, hasUnavailable, refreshCart, removeFromCart, updateQuantity, clearCart } = useCart();

  // Check prices and stock whenever the cart page opens
  useEffect(() => {
    refreshCart().then((notes) => notes.forEach((n) => toast(n, { icon: 'ℹ️' })));
  }, [refreshCart]);

  if (cartItems.length === 0) {
    return (
      <main className="flex min-h-[500px] flex-col items-center justify-center py-20 text-center">
        <ShoppingBag size={34} strokeWidth={1.3} className="text-gray-300" />
        <h1 className="mt-5 text-2xl font-medium text-gray-950">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500">Browse the shop and add something you like.</p>
        <Link to="/collection" className="mt-6 bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800">Start shopping</Link>
      </main>
    );
  }

  const toFree = Math.max(0, FREE_DELIVERY_OVER - cartTotal);

  return (
    <main className="py-10 sm:py-14">
      <div className="mb-10 flex items-end justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">Shopping cart</h1>
          <p className="mt-2 text-sm text-gray-500">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={() => window.confirm('Remove everything from your cart?') && clearCart()}
          className="cursor-pointer text-sm text-gray-500 underline-offset-4 hover:text-black hover:underline">
          Clear cart
        </button>
      </div>

      <div className="grid items-start gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        <ul className="divide-y divide-gray-100 border-y border-gray-100">
          {cartItems.map((item) => {
            const unavailable = item.available === false;
            const max = Number.isFinite(item.stock) ? item.stock : 99;
            const lineKey = `${item.productId}-${item.size}-${item.color}`;
            return (
              <li key={lineKey} className={`flex gap-4 py-6 sm:gap-6 ${unavailable ? 'opacity-60' : ''}`}>
                <Link to={`/product/${item.slug}`} className="h-32 w-24 shrink-0 overflow-hidden bg-gray-100 sm:h-36 sm:w-28">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <Link to={`/product/${item.slug}`} className="text-sm font-medium text-gray-900 hover:underline">{item.name}</Link>
                      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {item.size && <p>Size: {item.size}</p>}
                        {item.color && <p>Color: {item.color}</p>}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 text-sm">
                        <span className={item.compareAtPrice > item.price ? 'font-medium text-red-600' : 'text-gray-700'}>{ksh(item.price)}</span>
                        {item.compareAtPrice > item.price && <span className="text-xs text-gray-400 line-through">{ksh(item.compareAtPrice)}</span>}
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-gray-950">{ksh(item.price * item.quantity)}</p>
                  </div>

                  {unavailable ? (
                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertTriangle size={14} /> No longer available — please remove it.
                    </p>
                  ) : item.stock <= 5 ? (
                    <p className="mt-3 text-xs text-amber-700">Only {item.stock} left</p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex h-10 items-center border border-gray-200">
                      <button type="button" disabled={unavailable || item.quantity <= 1}
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-600 disabled:opacity-30" aria-label={`Decrease ${item.name}`}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button type="button" disabled={unavailable || item.quantity >= max}
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-600 disabled:opacity-30" aria-label={`Increase ${item.name}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-red-600" aria-label={`Remove ${item.name}`}>
                      <Trash2 size={15} strokeWidth={1.6} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="bg-gray-50 p-6 sm:p-7 lg:sticky lg:top-24">
          <h2 className="text-lg font-medium text-gray-950">Order summary</h2>

          <div className="mt-6 space-y-4 text-sm">
            <Row label={`Subtotal (${cartCount} items)`} value={ksh(cartTotal)} />
            {cartSavings > 0 && <Row label="You save" value={`− ${ksh(cartSavings)}`} valueClass="text-red-600" />}
            <Row label="Delivery" value={toFree === 0 ? 'Free' : 'From KSh 250'} valueClass={toFree === 0 ? 'text-green-700' : ''} />
          </div>

          {toFree > 0 ? (
            <div className="mt-5 bg-white p-3 text-xs text-gray-600">
              <p className="flex items-center gap-2"><Truck size={14} /> Add {ksh(toFree)} more for <b>free delivery</b>.</p>
              <div className="mt-2 h-1.5 overflow-hidden bg-gray-200">
                <div className="h-full bg-black" style={{ width: `${Math.min(100, (cartTotal / FREE_DELIVERY_OVER) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 bg-green-50 p-3 text-xs text-green-800"><Truck size={14} /> Your order qualifies for free delivery.</p>
          )}

          <div className="my-6 border-t border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-950">Estimated total</span>
            <span className="text-xl font-semibold text-gray-950">{ksh(cartTotal)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Delivery fee is calculated at checkout from your county.</p>

          {hasUnavailable && <p className="mt-5 text-xs font-medium text-red-600">Remove unavailable items to continue.</p>}

          <button type="button" disabled={hasUnavailable} onClick={() => navigate('/place-order')}
            className="group mt-6 flex w-full cursor-pointer items-center justify-center gap-3 bg-black px-6 py-4 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
            Proceed to checkout
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          <Link to="/collection" className="mt-4 block text-center text-sm text-gray-500 hover:text-black">Continue shopping</Link>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400"><LockKeyhole size={13} /> M-Pesa · Card · Cash on delivery</p>
        </aside>
      </div>
    </main>
  );
};

const Row = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium text-gray-800 ${valueClass}`}>{value}</span>
  </div>
);

export default Cart;
