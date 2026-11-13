import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import { dateTime, errorMessage, ksh, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../../lib/format';
import { getOrderById } from '../../services/order.service';
import { cancelOrder } from '../../services/shop.service';

const STEPS = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'PROCESSING', label: 'Preparing' },
  { status: 'SHIPPED', label: 'On the way' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const HISTORY_LABELS = {
  PLACED: 'Order placed', PAID: 'Payment received', PAYMENT_FAILED: 'Payment failed', PAYMENT_PENDING: 'Payment pending',
  PROCESSING: 'Preparing your order', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded', PENDING: 'Pending',
};

export const Badge = ({ map, value }) => (
  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${map[value]?.className || 'bg-gray-100 text-gray-600'}`}>
    {map[value]?.label || value}
  </span>
);

const OrderDetails = () => {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getOrderById(orderId).then((d) => setOrder(d.order)).catch((e) => setError(errorMessage(e, 'Order not found.')));
  }, [orderId]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const d = await cancelOrder(order._id, 'Cancelled by customer.');
      setOrder(d.order);
      toast.success('Order cancelled.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <main className="py-20 text-center">
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/orders" className="mt-6 inline-block text-sm underline">Back to my orders</Link>
      </main>
    );
  }
  if (!order) return <main className="py-20 text-center text-sm text-gray-500">Loading order…</main>;

  const cancelled = order.orderStatus === 'CANCELLED';
  const stepIndex = STEPS.findIndex((s) => s.status === order.orderStatus);
  const needsPayment = !cancelled && order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID';
  const canCancel = order.orderStatus === 'PENDING' && order.paymentStatus !== 'PAID';
  const s = order.shippingAddress;
  const b = order.billingAddress;

  return (
    <main className="py-10 sm:py-14">
      <Link to="/orders" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black">
        <ArrowLeft size={16} /> My orders
      </Link>

      {params.get('placed') && (
        <div className="mb-8 flex items-start gap-3 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={20} className="shrink-0" />
          <div>
            <p className="font-medium">Thank you! Your order has been placed.</p>
            <p className="mt-1">We've sent the details to {s.email}. You'll pay {ksh(order.total)} when it's delivered.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Order</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-gray-500">Placed {dateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge map={ORDER_STATUS} value={order.orderStatus} />
          <Badge map={PAYMENT_STATUS} value={order.paymentStatus} />
        </div>
      </div>

      {needsPayment && (
        <div className="mt-8 flex flex-col gap-3 border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">This order hasn't been paid yet. {order.payment?.lastMessage}</p>
          <Link to={`/orders/${order._id}/pay`} className="shrink-0 bg-black px-5 py-2.5 text-center text-sm font-medium text-white">Pay {ksh(order.total)}</Link>
        </div>
      )}

      {/* Tracking */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-gray-950">Order status</h2>
        {cancelled ? (
          <p className="mt-4 bg-gray-50 p-4 text-sm text-gray-600">This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : '.'}</p>
        ) : (
          <ol className="mt-6 grid grid-cols-4 gap-2">
            {STEPS.map((step, i) => {
              const done = i <= stepIndex;
              return (
                <li key={step.status} className="text-center">
                  <div className="relative flex items-center justify-center">
                    {i > 0 && <span className={`absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 ${i <= stepIndex ? 'bg-black' : 'bg-gray-200'}`} />}
                    <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-300'}`}>
                      {done ? <Check size={15} /> : i + 1}
                    </span>
                  </div>
                  <p className={`mt-2 text-xs sm:text-sm ${done ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                </li>
              );
            })}
          </ol>
        )}

        {(order.courier || order.trackingNumber) && (
          <p className="mt-6 flex items-center gap-2 text-sm text-gray-600">
            <Truck size={16} /> {order.courier} {order.trackingNumber && <>· tracking no. <b>{order.trackingNumber}</b></>}
          </p>
        )}
        {!cancelled && order.orderStatus !== 'DELIVERED' && order.deliveryDays && (
          <p className="mt-3 text-sm text-gray-500">Delivery to {s.county} usually takes {order.deliveryDays} once shipped.</p>
        )}

        {order.statusHistory?.length > 0 && (
          <ul className="mt-8 space-y-4 border-l border-gray-200 pl-5">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                <p className="text-sm font-medium text-gray-900">{HISTORY_LABELS[h.status] || h.status}</p>
                {h.note && <p className="text-sm text-gray-500">{h.note}</p>}
                <p className="text-xs text-gray-400">{dateTime(h.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="text-lg font-medium text-gray-950">Items</h2>
          <ul className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-4 py-5">
                <div className="h-24 w-20 shrink-0 bg-gray-100">
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <Package className="m-auto mt-8 text-gray-300" />}
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}</p>
                    <p className="mt-1 text-xs text-gray-500">{ksh(item.price)} each</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-900">{ksh(item.price * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
          {order.orderStatus === 'DELIVERED' && (
            <p className="mt-4 text-sm text-gray-500">Enjoying your purchase? Leave a review on the product page — it helps other shoppers.</p>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-gray-50 p-6 text-sm">
            <h3 className="font-medium text-gray-950">Payment summary</h3>
            <div className="mt-4 space-y-2">
              <Row label="Subtotal" value={ksh(order.subtotal)} />
              {order.discountTotal > 0 && <Row label="Discounts" value={`− ${ksh(order.discountTotal)}`} />}
              <Row label={`Delivery${order.deliveryZone ? ` (${order.deliveryZone})` : ''}`} value={order.deliveryFee ? ksh(order.deliveryFee) : 'Free'} />
              <div className="border-t border-gray-200 pt-2"><Row label={<b className="text-gray-900">Total</b>} value={<b>{ksh(order.total)}</b>} /></div>
              <Row label="Method" value={PAYMENT_METHOD[order.paymentMethod]} />
              {order.payment?.receipt && <Row label="Receipt" value={order.payment.receipt} />}
              {order.paidAt && <Row label="Paid" value={dateTime(order.paidAt)} />}
            </div>
          </div>

          <div className="bg-gray-50 p-6 text-sm leading-6 text-gray-600">
            <h3 className="font-medium text-gray-950">Delivery address</h3>
            <p className="mt-3">{s.firstName} {s.lastName}<br />{s.street}{s.apartment && `, ${s.apartment}`}<br />{s.city}, {s.county} {s.postalCode}<br />{s.phone}<br />{s.email}</p>
            {order.customerNote && <p className="mt-3 text-xs text-gray-500">Note: {order.customerNote}</p>}
          </div>

          {(b && (!b.sameAsShipping || b.companyName || b.kraPin)) && (
            <div className="bg-gray-50 p-6 text-sm leading-6 text-gray-600">
              <h3 className="font-medium text-gray-950">Billing</h3>
              <p className="mt-3">
                {b.companyName && <>{b.companyName}<br /></>}
                {b.kraPin && <>KRA PIN {b.kraPin}<br /></>}
                {b.sameAsShipping ? 'Same as delivery address' : <>{b.firstName} {b.lastName}<br />{b.street}, {b.city}, {b.county}<br />{b.phone}</>}
              </p>
            </div>
          )}

          {canCancel && (
            <button type="button" disabled={cancelling} onClick={cancel}
              className="w-full cursor-pointer border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-60">
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </aside>
      </div>
    </main>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-gray-500">{label}</span>
    <span className="text-right text-gray-800">{value}</span>
  </div>
);

export default OrderDetails;
