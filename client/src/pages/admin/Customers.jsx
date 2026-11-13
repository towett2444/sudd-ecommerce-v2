import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { Btn, Card, Drawer, inputClass, PageHeader, Pager, Stat, TableWrap, Td, Th } from '../../components/admin/ui';
import useAuth from '../../hooks/useAuth';
import { dateOnly, dateTime, errorMessage, ksh, ORDER_STATUS, PAYMENT_STATUS } from '../../lib/format';
import { adminCustomer, adminCustomers, adminDeleteCustomer, adminUpdateCustomer } from '../../services/shop.service';
import { Badge } from '../public/OrderDetails';

const Customers = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('q') || '');
  const openId = params.get('open');

  const query = new URLSearchParams(params);
  query.delete('open');
  const key = query.toString();

  const load = useCallback(() => {
    adminCustomers(Object.fromEntries(new URLSearchParams(key))).then(setData).catch((e) => toast.error(errorMessage(e)));
  }, [key]);
  useEffect(() => { load(); }, [load]);

  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes) && !('open' in changes)) next.delete('page');
    setParams(next);
  };

  return (
    <div>
      <PageHeader title="Customers" text="Accounts, what they've ordered, and access control." />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <form className="relative min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim() }); }}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone…" className={`${inputClass} pl-9`} aria-label="Search customers" />
          </form>
          <select value={params.get('role') || ''} onChange={(e) => set({ role: e.target.value })} className={`${inputClass} !w-auto`} aria-label="Role">
            <option value="">Customers & admins</option><option value="CUSTOMER">Customers</option><option value="ADMIN">Admins</option>
          </select>
          <select value={params.get('status') || ''} onChange={(e) => set({ status: e.target.value })} className={`${inputClass} !w-auto`} aria-label="Status">
            <option value="">Active & blocked</option><option value="active">Active</option><option value="blocked">Blocked</option>
          </select>
          <select value={params.get('sort') || ''} onChange={(e) => set({ sort: e.target.value })} className={`${inputClass} !w-auto`} aria-label="Sort">
            <option value="">Newest</option><option value="spent">Top spenders</option><option value="orders">Most orders</option><option value="name">Name</option>
          </select>
        </div>
        {!data ? <p className="p-8 text-center text-sm text-gray-500">Loading…</p> : (
          <>
            <TableWrap>
              <thead><tr><Th>Customer</Th><Th>Phone</Th><Th>Joined</Th><Th>Orders</Th><Th>Spent</Th><Th>Status</Th></tr></thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c._id} onClick={() => set({ open: c._id })} className="cursor-pointer hover:bg-gray-50">
                    <Td><p className="font-medium">{c.name}{c.role === 'ADMIN' && <span className="ml-2 bg-gray-900 px-1.5 py-0.5 text-[10px] text-white">ADMIN</span>}</p><p className="text-xs text-gray-400">{c.email}</p></Td>
                    <Td>{c.phone || '—'}</Td>
                    <Td>{dateOnly(c.createdAt)}</Td>
                    <Td>{c.orders}</Td>
                    <Td className="font-medium">{ksh(c.spent)}</Td>
                    <Td>{c.active ? <span className="text-green-700">Active</span> : <span className="text-red-600">Blocked</span>}</Td>
                  </tr>
                ))}
                {!data.customers.length && <tr><Td className="py-12 text-center text-gray-500">No customers found.</Td></tr>}
              </tbody>
            </TableWrap>
            <Pager page={data.page} pages={data.pages} total={data.total} label="accounts" onPage={(page) => set({ page: String(page) })} />
          </>
        )}
      </Card>

      <Drawer open={Boolean(openId)} onClose={() => set({ open: '' })} title="Customer">
        {openId && <CustomerPanel id={openId} onChanged={load} onDeleted={() => { set({ open: '' }); load(); }} />}
      </Drawer>
    </div>
  );
};

const CustomerPanel = ({ id, onChanged, onDeleted }) => {
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => adminCustomer(id).then(setData).catch((e) => toast.error(errorMessage(e))), [id]);
  useEffect(() => { load(); }, [load]);

  const update = async (body, msg) => {
    setBusy(true);
    try {
      await adminUpdateCustomer(id, body);
      toast.success(msg);
      await load();
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this account permanently? This cannot be undone.')) return;
    try {
      await adminDeleteCustomer(id);
      toast.success('Account deleted.');
      onDeleted();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;
  const c = data.customer;
  const self = String(me?.id) === String(c._id);

  return (
    <div className="space-y-6 text-sm">
      <div>
        <p className="text-lg font-semibold">{c.name}</p>
        <p className="text-gray-500">{c.email}{c.phone && ` · ${c.phone}`}</p>
        <p className="mt-1 text-xs text-gray-400">Joined {dateOnly(c.createdAt)} · last sign-in {dateTime(c.lastLoginAt)}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Orders" value={data.stats.orders} />
        <Stat label="Spent" value={ksh(data.stats.spent)} />
        <Stat label="Reviews" value={data.stats.reviews} />
      </div>

      <div className="flex flex-wrap gap-2">
        {c.active ? (
          <Btn variant="danger" disabled={busy || self} onClick={() => window.confirm(`Block ${c.name}? They will be signed out and can't sign in.`) && update({ active: false }, 'Account blocked.')}>Block account</Btn>
        ) : (
          <Btn variant="green" disabled={busy} onClick={() => update({ active: true }, 'Account unblocked.')}>Unblock account</Btn>
        )}
        {c.role === 'CUSTOMER' ? (
          <Btn variant="light" disabled={busy} onClick={() => window.confirm(`Give ${c.name} full admin access?`) && update({ role: 'ADMIN' }, 'Now an admin.')}>Make admin</Btn>
        ) : (
          <Btn variant="light" disabled={busy || self} onClick={() => update({ role: 'CUSTOMER' }, 'Admin access removed.')}>Remove admin access</Btn>
        )}
        {data.stats.orders === 0 && !self && <Btn variant="danger" onClick={remove}>Delete account</Btn>}
      </div>

      <div>
        <p className="font-medium">Orders</p>
        {data.orders.length ? (
          <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {data.orders.map((o) => (
              <li key={o._id}>
                <Link to={`/dashboard/orders?open=${o._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50">
                  <span><span className="font-medium">{o.orderNumber}</span><span className="block text-xs text-gray-400">{dateOnly(o.createdAt)}</span></span>
                  <span className="flex items-center gap-2"><Badge map={PAYMENT_STATUS} value={o.paymentStatus} /><Badge map={ORDER_STATUS} value={o.orderStatus} /><b>{ksh(o.total)}</b></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-gray-500">No orders yet.</p>}
      </div>

      <div>
        <p className="font-medium">Saved addresses</p>
        {c.addresses.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {c.addresses.map((a) => (
              <li key={a._id} className="bg-gray-50 p-3 leading-6 text-gray-600">
                <b className="text-gray-900">{a.label}</b>{a.isDefault && ' (default)'}<br />{a.firstName} {a.lastName}<br />{a.street}, {a.city}, {a.county}<br />{a.phone}
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-gray-500">None saved.</p>}
      </div>
    </div>
  );
};

export default Customers;
