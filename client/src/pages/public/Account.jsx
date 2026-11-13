import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, MapPin, Package, Pencil, Star, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../lib/format';
import {
  addAddress, changePassword, deleteAddress, getAddresses, getStoreConfig, setDefaultAddress, updateAddress, updateProfile,
} from '../../services/shop.service';
import { CountySelect, Input } from './PlaceOrder';

const TABS = [
  ['profile', 'Profile', UserRound],
  ['addresses', 'Addresses', MapPin],
  ['password', 'Password', KeyRound],
];

// Customer account: profile, saved delivery addresses, password. Orders have their own page.
const Account = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'profile';
  const { user } = useAuth();

  return (
    <main className="py-10 sm:py-14">
      <div className="mb-10 border-b border-gray-200 pb-8">
        <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">My account</h1>
        <p className="mt-2 text-sm text-gray-500">Signed in as {user?.email}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Account sections">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setParams({ tab: id })} aria-current={tab === id}
              className={`flex shrink-0 cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm ${tab === id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon size={17} strokeWidth={1.7} /> {label}
            </button>
          ))}
          <Link to="/orders" className="flex shrink-0 items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100">
            <Package size={17} strokeWidth={1.7} /> My orders
          </Link>
        </nav>

        <div className="max-w-2xl">
          {tab === 'profile' && <Profile />}
          {tab === 'addresses' && <Addresses />}
          {tab === 'password' && <Password />}
        </div>
      </div>
    </main>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await updateProfile(form);
      setUser(d.user);
      toast.success(d.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-medium text-gray-950">Profile</h2>
      <Input label="Full name" name="name" value={form.name} onChange={onChange} autoComplete="name" required />
      <Input label="Email address" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" required />
      <Input label="Phone number" name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="07XX XXX XXX" autoComplete="tel" />
      <button type="submit" disabled={saving} className="cursor-pointer bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-60">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
};

const Password = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('The new passwords do not match.');
    setSaving(true);
    try {
      const d = await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success(d.message);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-medium text-gray-950">Change password</h2>
      <Input label="Current password" name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} autoComplete="current-password" required />
      <Input label="New password (at least 8 characters)" name="newPassword" type="password" value={form.newPassword} onChange={onChange} autoComplete="new-password" required />
      <Input label="Confirm new password" name="confirm" type="password" value={form.confirm} onChange={onChange} autoComplete="new-password" required />
      <p className="text-xs text-gray-500">Changing your password signs you out on your other devices.</p>
      <button type="submit" disabled={saving} className="cursor-pointer bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-60">
        {saving ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
};

const blank = { label: 'Home', firstName: '', lastName: '', phone: '', street: '', apartment: '', city: '', county: '', postalCode: '', isDefault: false };

const Addresses = () => {
  const [addresses, setAddresses] = useState(null);
  const [counties, setCounties] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | address id
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAddresses().then((d) => setAddresses(d.addresses)).catch(() => setAddresses([]));
    getStoreConfig().then((d) => setCounties(d.counties)).catch(() => {});
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const startEdit = (a) => { setEditing(a ? a._id : 'new'); setForm(a ? { ...blank, ...a } : blank); };

  const run = async (fn) => {
    setSaving(true);
    try {
      const d = await fn();
      setAddresses(d.addresses);
      toast.success(d.message);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const ok = await run(() => (editing === 'new' ? addAddress(form) : updateAddress(editing, form)));
    if (ok) setEditing(null);
  };

  if (addresses === null) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-950">Delivery addresses</h2>
        {!editing && addresses.length < 10 && (
          <button type="button" onClick={() => startEdit(null)} className="cursor-pointer bg-black px-4 py-2 text-sm font-medium text-white">Add address</button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-6 grid gap-4 border border-gray-200 p-5 sm:grid-cols-2">
          <Input label="Label (e.g. Home, Office)" name="label" value={form.label} onChange={onChange} />
          <div />
          <Input label="First name" name="firstName" value={form.firstName} onChange={onChange} required />
          <Input label="Last name" name="lastName" value={form.lastName} onChange={onChange} required />
          <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={onChange} required />
          <Input label="Town / city" name="city" value={form.city} onChange={onChange} required />
          <div className="sm:col-span-2"><Input label="Street / building" name="street" value={form.street} onChange={onChange} required /></div>
          <div className="sm:col-span-2"><Input label="Apartment / landmark" name="apartment" value={form.apartment} onChange={onChange} /></div>
          <CountySelect counties={counties} name="county" value={form.county} onChange={onChange} />
          <Input label="Postal code" name="postalCode" value={form.postalCode} onChange={onChange} />
          <label className="flex items-center gap-3 text-sm text-gray-600 sm:col-span-2">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={onChange} className="h-4 w-4 accent-black" /> Use as my default address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className="cursor-pointer bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">Save address</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer px-4 text-sm text-gray-500">Cancel</button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <p className="mt-6 border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No saved addresses yet. They make checkout faster.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a._id} className={`border p-5 text-sm ${a.isDefault ? 'border-black' : 'border-gray-200'}`}>
              <p className="font-medium text-gray-900">{a.label}{a.isDefault && <span className="ml-2 text-xs font-normal text-gray-500">Default</span>}</p>
              <p className="mt-2 leading-6 text-gray-600">{a.firstName} {a.lastName}<br />{a.street}{a.apartment && `, ${a.apartment}`}<br />{a.city}, {a.county}<br />{a.phone}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <button type="button" onClick={() => startEdit(a)} className="flex cursor-pointer items-center gap-1 hover:underline"><Pencil size={13} /> Edit</button>
                {!a.isDefault && (
                  <button type="button" disabled={saving} onClick={() => run(() => setDefaultAddress(a._id))} className="flex cursor-pointer items-center gap-1 hover:underline">
                    <Star size={13} /> Make default
                  </button>
                )}
                <button type="button" disabled={saving} onClick={() => window.confirm('Delete this address?') && run(() => deleteAddress(a._id))}
                  className="flex cursor-pointer items-center gap-1 text-red-600 hover:underline">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Account;
