import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, Check, CreditCard, LockKeyhole, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { errorMessage, ksh } from '../../lib/format';
import { createOrder } from '../../services/order.service';
import { getAddresses, getPaymentOptions, getStoreConfig, startCard, startMpesa } from '../../services/shop.service';

const emptyAddress = { firstName: '', lastName: '', phone: '', street: '', apartment: '', city: '', county: '', postalCode: '' };

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartCount, cartTotal, cartSavings, hasUnavailable, clearCart, refreshCart } = useCart();

  const [config, setConfig] = useState({ counties: [], deliveryZones: [], freeDeliveryOver: null });
  const [payOptions, setPayOptions] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('new');
  const [shipping, setShipping] = useState({ ...emptyAddress, email: user?.email || '' });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({ ...emptyAddress, email: '', companyName: '', kraPin: '' });
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStoreConfig().then(setConfig).catch(() => {});
    getPaymentOptions().then(setPayOptions).catch(() => {});
    getAddresses()
      .then((d) => {
        setAddresses(d.addresses || []);
        const def = d.addresses?.find((a) => a.isDefault) || d.addresses?.[0];
        if (def) {
          setAddressId(def._id);
          setShipping((s) => ({ ...s, ...pick(def) }));
          setSaveAddress(false);
        }
      })
      .catch(() => {});
    refreshCart().then((notes) => notes.forEach((n) => toast(n, { icon: 'ℹ️' })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setShipping((s) => ({ ...s, email: s.email || user?.email || '', phone: s.phone || user?.phone || '' }));
  }, [user]);

  // Delivery fee from the county (same rules as the server, which has the final say)
  const delivery = useMemo(() => {
    if (!shipping.county || !config.deliveryZones.length) return null;
    const zone = config.deliveryZones.find((z) => z.counties.includes(shipping.county)) || config.deliveryZones.at(-1);
    const free = config.freeDeliveryOver != null && cartTotal >= config.freeDeliveryOver;
    return { zone: zone.name, days: zone.days, fee: free ? 0 : zone.fee, free };
  }, [shipping.county, config, cartTotal]);

  const total = cartTotal + (delivery?.fee || 0);
  const available = cartItems.filter((i) => i.available !== false);

  const chooseAddress = (id) => {
    setAddressId(id);
    if (id === 'new') {
      setShipping((s) => ({ ...emptyAddress, email: s.email }));
      setSaveAddress(true);
    } else {
      const a = addresses.find((x) => x._id === id);
      setShipping((s) => ({ ...s, ...pick(a) }));
      setSaveAddress(false);
    }
  };

  const onShip = (e) => {
    const { name, value } = e.target;
    setShipping((p) => ({ ...p, [name]: value }));
    if (addressId !== 'new' && name !== 'email') setAddressId('new');
  };
  const onBill = (e) => setBilling((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!available.length) return navigate('/cart');
    if (hasUnavailable) {
      toast.error('Some items are no longer available. Please review your cart.');
      return navigate('/cart');
    }

    setLoading(true);
    let order;
    try {
      const data = await createOrder({
        items: available.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
        shippingAddress: { ...shipping, country: 'Kenya' },
        billingAddress: billingSame
          ? { sameAsShipping: true, companyName: billing.companyName, kraPin: billing.kraPin }
          : { ...billing, sameAsShipping: false, country: 'Kenya' },
        paymentMethod,
        mpesaPhone: mpesaPhone || shipping.phone,
        customerNote,
        saveAddress: addressId === 'new' && saveAddress,
      });
      order = data.order;
      clearCart();
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to place order.'));
      if (error.response?.status === 409) refreshCart();
      setLoading(false);
      return;
    }

    // Order is placed; now start the payment.
    try {
      if (paymentMethod === 'MPESA') {
        await startMpesa(order._id, mpesaPhone || shipping.phone);
        navigate(`/orders/${order._id}/pay`, { replace: true });
      } else if (paymentMethod === 'CARD') {
        const r = await startCard(order._id);
        if (r.authorizationUrl) {
          window.location.assign(r.authorizationUrl);
          return;
        }
        navigate(`/orders/${order._id}/pay`, { replace: true });
      } else {
        toast.success('Order placed! Pay when it is delivered.');
        navigate(`/orders/${order._id}?placed=1`, { replace: true });
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Your order was placed but the payment could not start. You can try again.'));
      navigate(`/orders/${order._id}/pay`, { replace: true });
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="flex min-h-[500px] flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-medium text-gray-950">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500">Add some products before checking out.</p>
        <Link to="/collection" className="mt-6 bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800">Continue shopping</Link>
      </main>
    );
  }

  const testLabel = (live) => (payOptions && !live ? ' (test mode)' : '');

  return (
    <main className="py-10 sm:py-14">
      <div className="mb-10 border-b border-gray-200 pb-8">
        <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">Checkout</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">Enter your delivery and billing details, then choose how to pay.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid items-start gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div>
          {/* Delivery */}
          <Section title="1. Delivery details">
            {addresses.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <Choice key={a._id} active={addressId === a._id} onClick={() => chooseAddress(a._id)}>
                    <p className="text-sm font-medium text-gray-900">{a.label}{a.isDefault && <span className="ml-2 text-xs font-normal text-gray-400">default</span>}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{a.firstName} {a.lastName} · {a.phone}<br />{a.street}, {a.city}, {a.county}</p>
                  </Choice>
                ))}
                <Choice active={addressId === 'new'} onClick={() => chooseAddress('new')}>
                  <p className="text-sm font-medium text-gray-900">+ New address</p>
                  <p className="mt-1 text-xs text-gray-500">Deliver somewhere else</p>
                </Choice>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" name="firstName" value={shipping.firstName} onChange={onShip} autoComplete="given-name" required />
              <Input label="Last name" name="lastName" value={shipping.lastName} onChange={onShip} autoComplete="family-name" required />
              <Input label="Email (for your receipt)" name="email" type="email" value={shipping.email} onChange={onShip} autoComplete="email" required />
              <Input label="Phone number" name="phone" type="tel" value={shipping.phone} onChange={onShip} placeholder="07XX XXX XXX" autoComplete="tel" required />
              <div className="sm:col-span-2">
                <Input label="Street / road and building" name="street" value={shipping.street} onChange={onShip} autoComplete="street-address" required />
              </div>
              <div className="sm:col-span-2">
                <Input label="Apartment, floor or landmark" name="apartment" value={shipping.apartment} onChange={onShip} placeholder="Optional" />
              </div>
              <Input label="Town / city" name="city" value={shipping.city} onChange={onShip} placeholder="Nairobi" autoComplete="address-level2" required />
              <CountySelect counties={config.counties} value={shipping.county} onChange={onShip} name="county" />
              <Input label="Postal code" name="postalCode" value={shipping.postalCode} onChange={onShip} placeholder="00100" autoComplete="postal-code" />
            </div>

            {delivery && (
              <p className="mt-4 bg-gray-50 p-3 text-sm text-gray-600">
                Delivery to <b>{shipping.county}</b> ({delivery.zone}): {delivery.free ? <b className="text-green-700">Free</b> : <b>{ksh(delivery.fee)}</b>} · usually {delivery.days}
              </p>
            )}

            {addressId === 'new' && (
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-gray-600">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-black" />
                Save this address to my account
              </label>
            )}

            <label className="mt-6 block">
              <span className="mb-2 block text-xs font-medium text-gray-600">Delivery instructions (optional)</span>
              <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={2} maxLength={500}
                placeholder="E.g. call when at the gate" className="input py-3" />
            </label>
          </Section>

          {/* Billing */}
          <Section title="2. Billing details">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-black" />
              Billing address is the same as delivery
            </label>
            {!billingSame && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="First name" name="firstName" value={billing.firstName} onChange={onBill} required />
                <Input label="Last name" name="lastName" value={billing.lastName} onChange={onBill} required />
                <Input label="Phone number" name="phone" type="tel" value={billing.phone} onChange={onBill} required />
                <Input label="Email" name="email" type="email" value={billing.email} onChange={onBill} />
                <div className="sm:col-span-2"><Input label="Street / building" name="street" value={billing.street} onChange={onBill} required /></div>
                <Input label="Town / city" name="city" value={billing.city} onChange={onBill} required />
                <CountySelect counties={config.counties} value={billing.county} onChange={onBill} name="county" />
              </div>
            )}
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer text-gray-600">Need a business invoice? Add company name and KRA PIN</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input label="Company name" name="companyName" value={billing.companyName} onChange={onBill} />
                <Input label="KRA PIN" name="kraPin" value={billing.kraPin} onChange={onBill} placeholder="A123456789B" />
              </div>
            </details>
          </Section>

          {/* Payment */}
          <Section title="3. Payment">
            <div className="space-y-3">
              <PaymentOption active={paymentMethod === 'MPESA'} onClick={() => setPaymentMethod('MPESA')}
                icon={<Smartphone size={20} strokeWidth={1.6} />} title={`M-Pesa${testLabel(payOptions?.mpesa.live)}`}
                description="We send a payment prompt to your phone. Enter your M-Pesa PIN to pay." badge="Recommended" />
              <PaymentOption active={paymentMethod === 'CARD'} onClick={() => setPaymentMethod('CARD')}
                icon={<CreditCard size={20} strokeWidth={1.6} />} title={`Debit / credit card${testLabel(payOptions?.card.live)}`}
                description="Visa or Mastercard, on a secure payment page." />
              <PaymentOption active={paymentMethod === 'COD'} onClick={() => setPaymentMethod('COD')}
                icon={<Banknote size={20} strokeWidth={1.6} />} title="Cash on delivery"
                description="Pay with cash or M-Pesa when your order arrives." />
            </div>

            {paymentMethod === 'MPESA' && (
              <div className="mt-4 bg-gray-50 p-4">
                <Input label="M-Pesa phone number" name="mpesaPhone" type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder={shipping.phone || '07XX XXX XXX'} />
                <p className="mt-2 text-xs text-gray-500">Leave empty to use your delivery phone number.</p>
              </div>
            )}
            {payOptions && ((paymentMethod === 'MPESA' && !payOptions.mpesa.live) || (paymentMethod === 'CARD' && !payOptions.card.live)) && (
              <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Test mode: this payment method has no live keys yet, so no real money is taken. You'll be able to simulate the result on the next page.
              </p>
            )}
          </Section>
        </div>

        {/* Summary */}
        <aside className="bg-gray-50 p-6 sm:p-7 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-950">Order summary</h2>
            <span className="text-xs text-gray-400">{cartCount} item{cartCount === 1 ? '' : 's'}</span>
          </div>

          <div className="mt-6 max-h-80 space-y-5 overflow-y-auto pr-1">
            {available.map((p) => (
              <div key={`${p.productId}-${p.size}-${p.color}`} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 bg-gray-200">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white">{p.quantity}</span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="mt-1 text-xs text-gray-400">{[p.size && `Size ${p.size}`, p.color].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-800">{ksh(p.price * p.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 space-y-3 border-t border-gray-200 pt-6 text-sm">
            <Row label="Subtotal" value={ksh(cartTotal)} />
            {cartSavings > 0 && <Row label="Discounts applied" value={`− ${ksh(cartSavings)}`} valueClass="text-red-600" />}
            <Row label="Delivery" value={delivery ? (delivery.free ? 'Free' : ksh(delivery.fee)) : 'Choose county'} valueClass={delivery?.free ? 'text-green-700' : ''} />
          </div>
          <div className="my-6 border-t border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-950">Total</span>
            <span className="text-xl font-semibold text-gray-950">{ksh(total)}</span>
          </div>

          <button type="submit" disabled={loading || hasUnavailable}
            className="group mt-7 flex w-full cursor-pointer items-center justify-center gap-3 bg-black px-6 py-4 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Placing order…' : paymentMethod === 'MPESA' ? `Pay ${ksh(total)} with M-Pesa` : paymentMethod === 'CARD' ? `Pay ${ksh(total)} by card` : 'Place order'}
            {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
          </button>
          <p className="mt-4 text-center text-xs text-gray-400">By placing the order you agree to our delivery and returns terms.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400"><LockKeyhole size={13} /> Secure checkout</div>
        </aside>
      </form>
    </main>
  );
};

const pick = (a) => ({
  firstName: a.firstName, lastName: a.lastName, phone: a.phone, street: a.street, apartment: a.apartment || '',
  city: a.city, county: a.county, postalCode: a.postalCode || '',
});

const Section = ({ title, children }) => (
  <section className="border-b border-gray-200 pb-10 pt-2 [&+&]:pt-10">
    <h2 className="mb-6 text-xl font-medium text-gray-950">{title}</h2>
    {children}
  </section>
);

const Row = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium text-gray-800 ${valueClass}`}>{value}</span>
  </div>
);

export const Input = ({ label, name, type = 'text', value, onChange, placeholder, required = false, autoComplete }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-medium text-gray-600">
      {label}
      {required && <span className="ml-1 text-gray-400">*</span>}
    </span>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} autoComplete={autoComplete}
      className="h-12 w-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-500" />
  </label>
);

export const CountySelect = ({ counties, value, onChange, name }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-medium text-gray-600">County<span className="ml-1 text-gray-400">*</span></span>
    <select name={name} value={value} onChange={onChange} required autoComplete="address-level1"
      className="h-12 w-full cursor-pointer border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-500">
      <option value="">Choose county…</option>
      {counties.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  </label>
);

const Choice = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`relative cursor-pointer border p-4 text-left transition ${active ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}>
    {active && <Check size={15} className="absolute right-3 top-3" />}
    {children}
  </button>
);

const PaymentOption = ({ active, onClick, icon, title, description, badge }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`flex w-full cursor-pointer items-center gap-4 border p-4 text-left transition ${active ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-50 text-gray-700">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-900">
        {title}
        {badge && <span className="ml-2 bg-[#00a651] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">{badge}</span>}
      </p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{description}</p>
    </div>
    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
      {active && <Check size={12} strokeWidth={2} />}
    </div>
  </button>
);

export default PlaceOrder;
