import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Btn, Card, inputClass, PageHeader, TableWrap, Td, Th } from '../../components/admin/ui';
import { errorMessage, ksh } from '../../lib/format';
import { deleteProductByAdmin, updateProductByAdmin } from '../../services/product.service';
import { adminCategories, adminProducts, adminUpdateStock } from '../../services/shop.service';

// Product list. `stockMode` turns it into the Stock page (quick stock updates).
const ListProduct = ({ stockMode = false }) => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(params.get('q') || '');

  const query = params.toString();
  const load = useCallback(() => {
    adminProducts(Object.fromEntries(new URLSearchParams(query))).then(setData).catch((e) => toast.error(errorMessage(e)));
  }, [query]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { adminCategories().then((d) => setCategories(d.categories)).catch(() => {}); }, []);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const toggleActive = async (p) => {
    const form = new FormData();
    form.append('active', String(!p.active));
    try {
      await updateProductByAdmin(p._id, form);
      toast.success(p.active ? 'Hidden from the store.' : 'Visible in the store.');
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? If it is on past orders it will be hidden instead.`)) return;
    try {
      const r = await deleteProductByAdmin(p._id);
      toast.success(r.message);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const s = data?.summary;

  return (
    <div>
      <PageHeader
        title={stockMode ? 'Stock' : 'Products'}
        text={stockMode ? 'Update stock levels after deliveries, counts or damages.' : 'Add, edit, hide or delete products.'}
      >
        <Link to="/dashboard/add" className="inline-flex h-10 items-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white"><Plus size={16} /> Add product</Link>
      </PageHeader>

      {s && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {[['', `All (${s.total})`], ['low', `Low stock (${s.low})`], ['out', `Out of stock (${s.out})`]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set('stock', v)}
              className={`cursor-pointer border px-3 py-1.5 ${(params.get('stock') || '') === v ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>{l}</button>
          ))}
          <span className="ml-auto self-center text-gray-500">{s.units.toLocaleString()} units in stock · value {ksh(s.value)}</span>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <form className="relative min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); set('q', search.trim()); }}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or type…" className={`${inputClass} pl-9`} aria-label="Search products" />
          </form>
          <select value={params.get('category') || ''} onChange={(e) => set('category', e.target.value)} className={`${inputClass} !w-auto`} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id}>{c.name}</option>)}
          </select>
          <select value={params.get('status') || ''} onChange={(e) => set('status', e.target.value)} className={`${inputClass} !w-auto`} aria-label="Visibility">
            <option value="">Visible & hidden</option>
            <option value="active">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <select value={params.get('sort') || ''} onChange={(e) => set('sort', e.target.value)} className={`${inputClass} !w-auto`} aria-label="Sort">
            <option value="">Newest</option>
            <option value="name">Name</option>
            <option value="stock-asc">Stock: lowest first</option>
            <option value="stock-desc">Stock: highest first</option>
            <option value="sold">Best selling</option>
          </select>
        </div>

        {!data ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <TableWrap>
            <thead>
              <tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>{stockMode ? 'Update stock' : 'Stock'}</Th><Th>Sold</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id} className={`hover:bg-gray-50 ${p.active ? '' : 'opacity-60'}`}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url} alt="" className="h-12 w-10 shrink-0 bg-gray-100 object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.sku || '—'}{!p.active && ' · hidden'}{p.featured && ' · featured'}
                          {p.ratingCount > 0 && <span className="ml-1 inline-flex items-center gap-0.5"><Star size={10} fill="currentColor" />{p.ratingAverage}</span>}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.category}<p className="text-xs text-gray-400">{p.subCategory}</p></Td>
                  <Td>
                    <span className={p.onSale ? 'font-medium text-red-600' : ''}>{ksh(p.price)}</span>
                    {p.onSale && <p className="text-xs text-gray-400 line-through">{ksh(p.compareAtPrice)}</p>}
                  </Td>
                  <Td>{stockMode ? <StockEditor product={p} onSaved={load} /> : <StockBadge p={p} />}</Td>
                  <Td>{p.soldCount}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/product/${p.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100" title="View in store"><Eye size={15} /></Link>
                      <button type="button" onClick={() => toggleActive(p)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100" title={p.active ? 'Hide from store' : 'Show in store'}>
                        {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <Link to={`/dashboard/list/edit/${p._id}`} className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100" title="Edit"><Pencil size={15} /></Link>
                      <button type="button" onClick={() => remove(p)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!data.products.length && <tr><Td className="py-12 text-center text-gray-500">No products match.</Td></tr>}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};

const StockBadge = ({ p }) =>
  p.stock <= 0 ? <span className="bg-red-50 px-2 py-1 text-xs font-medium text-red-700">Out of stock</span>
    : p.stock <= p.lowStockThreshold ? <span className="bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{p.stock} · low</span>
      : <span className="text-sm">{p.stock}</span>;

// Inline stock control: add received units, remove units, or type the exact count.
const StockEditor = ({ product, onSaved }) => {
  const [value, setValue] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(String(product.stock)), [product.stock]);

  const save = async (body) => {
    setBusy(true);
    try {
      const r = await adminUpdateStock(product._id, body);
      toast.success(r.message);
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Btn variant="light" className="!h-8 !w-8 !px-0" disabled={busy || product.stock <= 0} onClick={() => save({ change: -1 })} aria-label="Remove one">−</Btn>
      <form onSubmit={(e) => { e.preventDefault(); if (value !== String(product.stock)) save({ stock: Number(value) }); }} className="flex items-center gap-1.5">
        <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`Stock for ${product.name}`}
          className={`h-8 w-16 border px-2 text-center text-sm outline-none ${product.stock <= 0 ? 'border-red-300' : product.stock <= product.lowStockThreshold ? 'border-amber-300' : 'border-gray-200'}`} />
        {value !== String(product.stock) && <Btn type="submit" className="!h-8 !px-2 text-xs" disabled={busy}>Save</Btn>}
      </form>
      <Btn variant="light" className="!h-8 !w-8 !px-0" disabled={busy} onClick={() => save({ change: 1 })} aria-label="Add one">+</Btn>
      <Btn variant="light" className="!h-8 !px-2 text-xs" disabled={busy} onClick={() => {
        const n = Number(window.prompt(`How many units of "${product.name}" arrived?`, '10'));
        if (Number.isInteger(n) && n > 0) save({ change: n });
      }}>Receive…</Btn>
    </div>
  );
};

export default ListProduct;
