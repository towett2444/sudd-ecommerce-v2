import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { Badge } from '../public/OrderDetails';
import { Card, PageHeader, Stat, TableWrap, Td, Th } from '../../components/admin/ui';
import { dateTime, ksh, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../../lib/format';
import { getAdminDashboard } from '../../services/dashboard.service';

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard().then(setData).catch((e) => setError(e.response?.data?.message || 'Failed to load the dashboard.'));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;

  const s = data.stats;

  return (
    <div>
      <PageHeader title="Overview" text="Today's sales, orders that need attention and stock to reorder.">
        <Link to="/dashboard/add" className="inline-flex h-10 items-center bg-gray-950 px-4 text-sm font-medium text-white">Add product</Link>
        <Link to="/dashboard/reports" className="inline-flex h-10 items-center border border-gray-200 bg-white px-4 text-sm font-medium">Sales reports</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue today" value={ksh(s.revenueToday)} hint={`${s.ordersPaidToday} paid order(s)`} />
        <Stat label="Revenue (30 days)" value={ksh(s.revenue30)} hint={`${s.orders30} paid orders`} />
        <Stat label="To fulfil" value={s.ordersAwaitingFulfillment} hint="Pending or processing" tone={s.ordersAwaitingFulfillment ? 'text-amber-700' : ''} />
        <Stat label="Customers" value={s.totalCustomers} hint={`${s.totalOrders} orders all time`} />
        <Stat label="Total revenue" value={ksh(s.totalRevenue)} hint="All paid orders" />
        <Stat label="Products" value={s.availableProducts} hint={`${s.totalProducts} including hidden`} />
        <Stat label="Out of stock" value={s.outOfStock} tone={s.outOfStock ? 'text-red-600' : ''} hint={<Link to="/dashboard/stock?stock=out" className="underline">View</Link>} />
        <Stat label="Unpaid cash orders" value={s.unpaidCod} hint="Collect on delivery" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Recent orders" action={<Link to="/dashboard/orders" className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">All orders <ArrowRight size={13} /></Link>}>
          <TableWrap>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <Td><Link to={`/dashboard/orders?open=${o._id}`} className="font-medium hover:underline">{o.orderNumber || o._id.slice(-6)}</Link><p className="text-xs text-gray-400">{dateTime(o.createdAt)}</p></Td>
                  <Td>{o.shippingAddress?.firstName} {o.shippingAddress?.lastName}<p className="text-xs text-gray-400">{o.shippingAddress?.county}</p></Td>
                  <Td className="font-medium">{ksh(o.total)}</Td>
                  <Td><Badge map={PAYMENT_STATUS} value={o.paymentStatus} /><p className="mt-1 text-xs text-gray-400">{PAYMENT_METHOD[o.paymentMethod]}</p></Td>
                  <Td><Badge map={ORDER_STATUS} value={o.orderStatus} /></Td>
                </tr>
              ))}
              {!data.recentOrders.length && <tr><Td className="py-10 text-center text-gray-500">No orders yet.</Td></tr>}
            </tbody>
          </TableWrap>
        </Card>

        <Card title="Low stock" action={<Link to="/dashboard/stock?stock=low" className="text-xs text-gray-500 hover:text-black">Manage stock</Link>}>
          {data.lowStock.length ? (
            <ul className="divide-y divide-gray-50">
              {data.lowStock.map((p) => (
                <li key={p._id} className="flex items-center gap-3 px-5 py-3">
                  <img src={p.images?.[0]?.url} alt="" className="h-10 w-9 shrink-0 bg-gray-100 object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-700"><AlertTriangle size={14} /> {p.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-gray-500">All products are well stocked.</p>
          )}
          {s.newReviews > 0 && (
            <Link to="/dashboard/reviews" className="block border-t border-gray-100 px-5 py-3 text-xs text-gray-600 hover:bg-gray-50">
              {s.newReviews} new review(s) this week →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
