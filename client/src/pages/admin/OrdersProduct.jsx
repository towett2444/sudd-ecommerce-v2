import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { Btn, Card, Drawer, Field, inputClass, PageHeader, Pager, TableWrap, Td, Th } from '../../components/admin/ui';
import { dateTime, errorMessage, ksh, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../../lib/format';
import { adminOrder, adminOrders, adminOrderStatus, adminPaymentStatus } from '../../services/shop.service';
import { Badge } from '../public/OrderDetails';

const NEXT = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'PENDING'],
  SHIPPED: ['DELIVERED', 'PROCESSING'],
  DELIVERED: [],
  CANCELLED: [],
};

const OrdersProduct = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('q') || '');
  const openId = params.get('open');

  const query = new URLSearchParams(params);
  query.delete('open');
  const queryKey = query.toString();

  const load = useCallback(() => {
    adminOrders(Object.fromEntries(new URLSearchParams(queryKey))).then(setData).catch((e) => toast.error(errorMessage(e)));
  }, [queryKey]);
  useEffect(() => { load(); }, [load]);

  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes) && !('open' in changes)) next.delete('page');
    setParams(next);
  };

  const exportCsv = () => {
    if (!data?.orders.length) return;
    const head = ['Order', 'Date', 'Customer', 'Phone', 'County', 'Items', 'Total', 'Method', 'Payment', 'Status', 'Receipt'];
    const rows = data.orders.map((o) => [
      o.orderNumber, new Date(o.createdAt).toISOString(), `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`, o.shippingAddress.phone,
      o.shippingAddress.county, o.items.reduce((s, i) => s + i.quantity, 0), o.total, o.paymentMethod, o.paymentStatus, o.orderStatus, o.payment?.receipt || '',
    ]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'orders.csv';
    a.click();
  };

  const counts = data?.statusCounts || {};

  return (
    <div>
      <PageHeader title="Orders" text="Process orders, update delivery status and confirm payments.">
        <Btn variant="light" onClick={exportCsv}>Export CSV</Btn>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {[['', 'All'], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} type="button" onClick={() => set({ status: k })}
            className={`cursor-pointer border px-3 py-1.5 ${(params.get('status') || '') === k ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
            {l}{k && counts[k] ? ` (${counts[k]})` : ''}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <form className="relative min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim() }); }}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order no., name, phone, email, M-Pesa receipt…" className={`${inputClass} pl-9`} aria-label="Search orders" />
          </form>
          <select value={params.get('payment') || ''} onChange={(e) => set({ payment: e.target.value })} className={`${inputClass} !w-auto`} aria-label="Payment status">
            <option value="">Any payment</option>
            {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={params.get('method') || ''} onChange={(e) => set({ method: e.target.value })} className={`${inputClass} !w-auto`} aria-label="Payment method">
            <option value="">Any method</option>
            {Object.entries(PAYMENT_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={params.get('from') || ''} onChange={(e) => set({ from: e.target.value })} className={`${inputClass} !w-auto`} aria-label="From date" />
          <input type="date" value={params.get('to') || ''} onChange={(e) => set({ to: e.target.value })} className={`${inputClass} !w-auto`} aria-label="To date" />
        </div>

        {!data ? <p className="p-8 text-center text-sm text-gray-500">Loading…</p> : (
          <>
            <TableWrap>
              <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o._id} onClick={() => set({ open: o._id })} className="cursor-pointer hover:bg-gray-50">
                    <Td><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-gray-400">{dateTime(o.createdAt)}</p></Td>
                    <Td>{o.shippingAddress.firstName} {o.shippingAddress.lastName}<p className="text-xs text-gray-400">{o.shippingAddress.phone} · {o.shippingAddress.county}</p></Td>
                    <Td>{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td className="font-medium">{ksh(o.total)}</Td>
                    <Td><Badge map={PAYMENT_STATUS} value={o.paymentStatus} /><p className="mt-1 text-xs text-gray-400">{PAYMENT_METHOD[o.paymentMethod]}</p></Td>
                    <Td><Badge map={ORDER_STATUS} value={o.orderStatus} /></Td>
                  </tr>
                ))}
                {!data.orders.length && <tr><Td className="py-12 text-center text-gray-500">No orders found.</Td></tr>}
              </tbody>
            </TableWrap>
            <Pager page={data.page} pages={data.pages} total={data.total} label="orders" onPage={(page) => set({ page: String(page) })} />
          </>
        )}
      </Card>

      <Drawer open={Boolean(openId)} onClose={() => set({ open: '' })} title="Order details">
        {openId && <OrderPanel id={openId} onChanged={load} />}
      </Drawer>
    </div>
  );
};

const OrderPanel = ({ id, onChanged }) => {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminOrder(id).then((d) => {
      setOrder(d.order);
      setCourier(d.order.courier || '');
      setTracking(d.order.trackingNumber || '');
      setStatus(NEXT[d.order.orderStatus][0] || '');
    }).catch((e) => toast.error(errorMessage(e)));
  }, [id]);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const d = await fn();
      setOrder(d.order);
      setStatus(NEXT[d.order.orderStatus][0] || '');
      setNote('');
      toast.success(msg || d.message);
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!order) return <p className="text-sm text-gray-500">Loading…</p>;
  const s = order.shippingAddress;
  const b = order.billingAddress;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-gray-500">{dateTime(order.createdAt)} · {order.deliveryZone}</p>
        </div>
        <div className="flex gap-2"><Badge map={ORDER_STATUS} value={order.orderStatus} /><Badge map={PAYMENT_STATUS} value={order.paymentStatus} /></div>
      </div>

      {NEXT[order.orderStatus].length > 0 && (
        <div className="space-y-3 border border-gray-200 p-4">
          <p className="font-medium">Update status</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="New status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {NEXT[order.orderStatus].map((st) => <option key={st} value={st}>{ORDER_STATUS[st].label}</option>)}
              </select>
            </Field>
            <Field label="Note for the customer (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} /></Field>
            {status === 'SHIPPED' && (
              <>
                <Field label="Courier / rider"><input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. G4S, Sendy, own rider" className={inputClass} /></Field>
                <Field label="Tracking number"><input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputClass} /></Field>
              </>
            )}
          </div>
          {status === 'CANCELLED' && <p className="text-xs text-amber-700">Cancelling puts the items back in stock.{order.paymentStatus === 'PAID' && ' This order is paid — refund the customer and mark it refunded below.'}</p>}
          {status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' && <p className="text-xs text-gray-500">Cash on delivery: marking it delivered also marks it paid.</p>}
          <Btn disabled={busy || !status} variant={status === 'CANCELLED' ? 'danger' : 'dark'}
            onClick={() => (status !== 'CANCELLED' || window.confirm('Cancel this order?')) &&
              run(() => adminOrderStatus(order._id, { status, note, ...(status === 'SHIPPED' && { courier, trackingNumber: tracking }) }))}>
            Save status
          </Btn>
        </div>
      )}

      <div className="border border-gray-200 p-4">
        <p className="font-medium">Payment</p>
        <dl className="mt-3 grid grid-cols-2 gap-y-2">
          <dt className="text-gray-500">Method</dt><dd>{PAYMENT_METHOD[order.paymentMethod]}{order.payment?.demo && ' (test)'}</dd>
          {order.payment?.phone && <><dt className="text-gray-500">M-Pesa phone</dt><dd>{order.payment.phone}</dd></>}
          {order.payment?.receipt && <><dt className="text-gray-500">Receipt</dt><dd className="font-mono">{order.payment.receipt}</dd></>}
          {order.paidAt && <><dt className="text-gray-500">Paid at</dt><dd>{dateTime(order.paidAt)}</dd></>}
          {order.payment?.lastMessage && <><dt className="text-gray-500">Last message</dt><dd>{order.payment.lastMessage}</dd></>}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED' && (
            <Btn variant="green" disabled={busy} onClick={() => {
              const receipt = window.prompt('Payment reference (e.g. M-Pesa code) — optional', '') ?? null;
              if (receipt !== null) run(() => adminPaymentStatus(order._id, { status: 'PAID', receipt }), 'Marked as paid.');
            }}>Mark as paid</Btn>
          )}
          {order.paymentStatus === 'PAID' && (
            <Btn variant="light" disabled={busy} onClick={() => window.confirm('Mark this payment as refunded?') && run(() => adminPaymentStatus(order._id, { status: 'REFUNDED' }), 'Marked as refunded.')}>
              Mark refunded
            </Btn>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium">Items</p>
        <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
          {order.items.map((i, n) => (
            <li key={n} className="flex items-center gap-3 py-3">
              <img src={i.image} alt="" className="h-12 w-10 bg-gray-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-gray-500">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(' · ')} · {i.quantity} × {ksh(i.price)}</p>
              </div>
              <p className="font-medium">{ksh(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1">
          <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{ksh(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Delivery ({order.deliveryZone || '—'})</dt><dd>{ksh(order.deliveryFee)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{ksh(order.total)}</dd></div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-50 p-4 leading-6">
          <p className="font-medium">Deliver to</p>
          <p className="mt-2 text-gray-600">{s.firstName} {s.lastName}<br />{s.street}{s.apartment && `, ${s.apartment}`}<br />{s.city}, {s.county}<br />
            <a href={`tel:${s.phone}`} className="underline">{s.phone}</a><br />{s.email}</p>
          {order.customerNote && <p className="mt-2 text-xs text-gray-500">Note: {order.customerNote}</p>}
        </div>
        <div className="bg-gray-50 p-4 leading-6">
          <p className="font-medium">Billing</p>
          <p className="mt-2 text-gray-600">
            {b?.companyName && <>{b.companyName}<br /></>}
            {b?.kraPin && <>KRA PIN {b.kraPin}<br /></>}
            {!b || b.sameAsShipping ? 'Same as delivery' : <>{b.firstName} {b.lastName}<br />{b.street}, {b.city}, {b.county}<br />{b.phone}</>}
          </p>
        </div>
      </div>

      <div>
        <p className="font-medium">History</p>
        <ul className="mt-3 space-y-2 border-l border-gray-200 pl-4">
          {[...order.statusHistory].reverse().map((h, n) => (
            <li key={n}><span className="font-medium">{h.status}</span>{h.note && ` — ${h.note}`}<p className="text-xs text-gray-400">{dateTime(h.at)}{h.by && ` · ${h.by}`}</p></li>
          ))}
        </ul>
      </div>

      <Btn variant="light" onClick={() => window.print()}><Printer size={15} /> Print</Btn>
    </div>
  );
};

export default OrdersProduct;
