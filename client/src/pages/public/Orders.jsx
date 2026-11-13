import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';

import { dateOnly, ksh, ORDER_STATUS, PAYMENT_STATUS } from '../../lib/format';
import { getMyOrders } from '../../services/order.service';
import { Badge } from './OrderDetails';

const FILTERS = [
  ['', 'All'],
  ['open', 'In progress'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
];

const Orders = () => {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getMyOrders().then((d) => setOrders(d.orders || [])).catch(() => setOrders([]));
  }, []);

  const shown = (orders || []).filter((o) =>
    !filter ? true : filter === 'open' ? ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus) : o.orderStatus === filter,
  );

  return (
    <main className="py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">My orders</h1>
          <p className="mt-2 text-sm text-gray-500">Track deliveries and view past purchases.</p>
        </div>
        <Link to="/account" className="text-sm text-gray-500 underline-offset-4 hover:text-black hover:underline">Account settings</Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" onClick={() => setFilter(v)}
            className={`cursor-pointer border px-4 py-2 text-sm ${filter === v ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {orders === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center border border-gray-200 text-center">
          <Package size={30} strokeWidth={1.3} className="text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">{orders.length ? 'No orders match this filter.' : "You haven't placed any orders yet."}</p>
          {!orders.length && <Link to="/collection" className="mt-5 bg-black px-5 py-2.5 text-sm font-medium text-white">Start shopping</Link>}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border-y border-gray-100">
          {shown.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="flex items-center gap-4 py-5 hover:bg-gray-50 sm:px-3">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((item, i) => (
                    <img key={i} src={item.image} alt="" className="h-14 w-12 border-2 border-white bg-gray-100 object-cover" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {dateOnly(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} item(s) · {ksh(o.total)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge map={ORDER_STATUS} value={o.orderStatus} />
                    {o.paymentMethod !== 'COD' || o.paymentStatus === 'PAID' ? <Badge map={PAYMENT_STATUS} value={o.paymentStatus} /> : null}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default Orders;
