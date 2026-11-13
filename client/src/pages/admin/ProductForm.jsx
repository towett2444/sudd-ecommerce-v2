import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, LoaderCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, Field, inputClass, PageHeader } from '../../components/admin/ui';
import { errorMessage } from '../../lib/format';
import { createProductByAdmin, getProductById, updateProductByAdmin } from '../../services/product.service';
import { adminCategories } from '../../services/shop.service';

const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;

const splitList = (text) => [...new Set(text.split(',').map((s) => s.trim()).filter(Boolean))];

// Add / edit product. With a :productId in the URL it edits that product.
const ProductForm = () => {
  const { productId } = useParams();
  const editing = Boolean(productId);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: '', subCategory: '', price: '', compareAtPrice: '', stock: '0',
    lowStockThreshold: '5', sku: '', sizes: '', colors: '', featured: false, bestseller: false, active: true,
  });
  // Each slot is { existing: {url, fileId} } or { file, preview }
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    adminCategories()
      .then((d) => {
        setCategories(d.categories);
        if (!editing && d.categories[0]) setForm((f) => ({ ...f, category: f.category || d.categories[0].name }));
      })
      .catch(() => {});
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    getProductById(productId)
      .then(({ product: p }) => {
        setForm({
          name: p.name, description: p.description, category: p.category, subCategory: p.subCategory,
          price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '', stock: String(p.stock ?? 0),
          lowStockThreshold: String(p.lowStockThreshold ?? 5), sku: p.sku || '', sizes: (p.sizes || []).join(', '),
          colors: (p.colors || []).join(', '), featured: Boolean(p.featured), bestseller: Boolean(p.bestseller), active: p.active !== false,
        });
        setSlots((p.images || []).map((existing) => ({ existing })));
      })
      .catch((e) => toast.error(errorMessage(e, 'Product not found.')))
      .finally(() => setLoading(false));
  }, [editing, productId]);

  // Free the photo previews when leaving the page
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  useEffect(() => () => slotsRef.current.forEach((s) => s.preview && URL.revokeObjectURL(s.preview)), []);

  const subOptions = useMemo(() => categories.find((c) => c.name === form.category)?.subCategories || [], [categories, form.category]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addFiles = (files) => {
    const room = MAX_IMAGES - slots.length;
    const accepted = [];
    for (const file of [...files]) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(`${file.name}: use JPG, PNG or WEBP.`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name} is larger than 5MB.`); continue; }
      if (accepted.length >= room) { toast.error(`Up to ${MAX_IMAGES} images.`); break; }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    setSlots((s) => [...s, ...accepted]);
  };

  const moveFirst = (i) => setSlots((s) => [s[i], ...s.filter((_, j) => j !== i)]);

  const submit = async (e) => {
    e.preventDefault();
    if (!slots.length) return toast.error('Add at least one product photo.');
    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
      return toast.error('"Original price" must be higher than the selling price, or left empty.');
    }

    const data = new FormData();
    ['name', 'description', 'category', 'subCategory', 'price', 'stock', 'lowStockThreshold', 'sku'].forEach((k) => data.append(k, form[k]));
    data.append('compareAtPrice', form.compareAtPrice || '');
    data.append('sizes', JSON.stringify(splitList(form.sizes)));
    data.append('colors', JSON.stringify(splitList(form.colors)));
    data.append('featured', String(form.featured));
    data.append('bestseller', String(form.bestseller));
    data.append('active', String(form.active));
    slots.forEach((s) => s.file && data.append('images', s.file));
    if (editing) data.append('imageSlots', JSON.stringify(slots.map((s) => (s.file ? 'new' : { fileId: s.existing.fileId }))));

    setSaving(true);
    try {
      const r = editing ? await updateProductByAdmin(productId, data) : await createProductByAdmin(data);
      toast.success(r.message);
      navigate('/dashboard/list');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the product.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  const discount = form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price)
    ? Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100) : 0;

  return (
    <form onSubmit={submit}>
      <Link to="/dashboard/list" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"><ArrowLeft size={15} /> Products</Link>
      <PageHeader title={editing ? 'Edit product' : 'Add product'} text="Fields marked * are required.">
        <button type="submit" disabled={saving} className="inline-flex h-10 cursor-pointer items-center gap-2 bg-gray-950 px-5 text-sm font-medium text-white disabled:opacity-60">
          {saving && <LoaderCircle size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Create product'}
        </button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Name *" className="sm:col-span-2"><input name="name" value={form.name} onChange={onChange} required maxLength={120} className={inputClass} /></Field>
              <Field label="Description *" className="sm:col-span-2">
                <textarea name="description" value={form.description} onChange={onChange} required rows={6} maxLength={5000} className={`${inputClass} h-auto py-2`} />
              </Field>
              <Field label="Category *" hint={<Link to="/dashboard/categories" className="underline">Manage categories</Link>}>
                <select name="category" value={form.category} onChange={onChange} required className={inputClass}>
                  {!form.category && <option value="">Choose…</option>}
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}{c.active ? '' : ' (hidden)'}</option>)}
                </select>
              </Field>
              <Field label="Product type *" hint="Pick from the list or type a new one">
                <input name="subCategory" value={form.subCategory} onChange={onChange} list="sub-options" required maxLength={60} className={inputClass} />
                <datalist id="sub-options">{subOptions.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
              <Field label="Sizes" hint="Comma separated, e.g. S, M, L, XL — leave empty if none"><input name="sizes" value={form.sizes} onChange={onChange} className={inputClass} /></Field>
              <Field label="Colours" hint="Comma separated, e.g. Black, White"><input name="colors" value={form.colors} onChange={onChange} className={inputClass} /></Field>
            </div>
          </Card>

          <Card title={`Photos (${slots.length}/${MAX_IMAGES})`}>
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              {slots.map((s, i) => (
                <div key={s.existing?.fileId || s.preview} className="group relative aspect-4/5 bg-gray-100">
                  <img src={s.preview || s.existing.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-2 top-2 bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">Main</span>
                  ) : (
                    <button type="button" onClick={() => moveFirst(i)} className="absolute left-2 top-2 cursor-pointer bg-white/90 px-1.5 py-0.5 text-[10px] font-medium">Make main</button>
                  )}
                  <button type="button" onClick={() => setSlots((all) => all.filter((_, j) => j !== i))}
                    className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 hover:bg-white" aria-label="Remove photo">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {slots.length < MAX_IMAGES && (
                <label className="flex aspect-4/5 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-gray-400">
                  <ImagePlus size={22} strokeWidth={1.5} />
                  Add photos
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="px-5 pb-5 text-xs text-gray-400">JPG, PNG or WEBP up to 5MB each. The first photo is shown in listings.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Price">
            <div className="grid gap-4 p-5">
              <Field label="Selling price (KSh) *"><input type="number" name="price" min="0" step="1" value={form.price} onChange={onChange} required className={inputClass} /></Field>
              <Field label="Original price (KSh)" hint={discount ? `Shows as ${discount}% off — a special offer` : 'Fill in to show a discount (must be higher than the selling price)'}>
                <input type="number" name="compareAtPrice" min="0" step="1" value={form.compareAtPrice} onChange={onChange} className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card title="Stock">
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Units in stock *"><input type="number" name="stock" min="0" step="1" value={form.stock} onChange={onChange} required className={inputClass} /></Field>
              <Field label="Low-stock alert at" hint="Warn when stock falls to this number"><input type="number" name="lowStockThreshold" min="0" step="1" value={form.lowStockThreshold} onChange={onChange} className={inputClass} /></Field>
              <Field label="SKU / code"><input name="sku" value={form.sku} onChange={onChange} maxLength={40} className={inputClass} /></Field>
            </div>
          </Card>

          <Card title="Visibility">
            <div className="space-y-4 p-5 text-sm">
              <Toggle name="active" checked={form.active} onChange={onChange} title="Show in store" text="Turn off to hide it without deleting." />
              <Toggle name="featured" checked={form.featured} onChange={onChange} title="Featured" text="Show in 'Featured products' on the homepage." />
              <Toggle name="bestseller" checked={form.bestseller} onChange={onChange} title="Best seller badge" text="Mark as a customer favourite." />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
};

const Toggle = ({ name, checked, onChange, title, text }) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="mt-0.5 h-4 w-4 accent-black" />
    <span><span className="block font-medium text-gray-900">{title}</span><span className="text-xs text-gray-500">{text}</span></span>
  </label>
);

export default ProductForm;
