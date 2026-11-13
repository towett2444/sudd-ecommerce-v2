import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Btn, Card, Drawer, Field, inputClass, PageHeader, TableWrap, Td, Th } from '../../components/admin/ui';
import { errorMessage } from '../../lib/format';
import { adminCategories, adminCreateCategory, adminDeleteCategory, adminUpdateCategory } from '../../services/shop.service';

const blank = { name: '', description: '', subCategories: '', sortOrder: '0', active: true, imageUrl: '' };

const Categories = () => {
  const [categories, setCategories] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminCategories().then((d) => setCategories(d.categories)).catch((e) => toast.error(errorMessage(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (c) => {
    setEditing(c || 'new');
    setFile(null);
    setForm(c ? {
      name: c.name, description: c.description || '', subCategories: (c.subCategories || []).join(', '),
      sortOrder: String(c.sortOrder ?? 0), active: c.active, imageUrl: c.image?.fileId ? '' : c.image?.url || '',
    } : blank);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('subCategories', JSON.stringify(form.subCategories.split(',').map((s) => s.trim()).filter(Boolean)));
    data.append('sortOrder', form.sortOrder);
    data.append('active', String(form.active));
    if (file) data.append('image', file);
    else if (form.imageUrl || editing === 'new' || !editing.image?.fileId) data.append('imageUrl', form.imageUrl);

    setSaving(true);
    try {
      const r = editing === 'new' ? await adminCreateCategory(data) : await adminUpdateCategory(editing._id, data);
      toast.success(r.message);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    try {
      const r = await adminDeleteCategory(c._id);
      toast.success(r.message);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const preview = file ? URL.createObjectURL(file) : form.imageUrl || (editing && editing !== 'new' ? editing.image?.url : '');

  return (
    <div>
      <PageHeader title="Categories" text="Shown on the homepage, in the shop filters and in the product form.">
        <Btn onClick={() => open(null)}><Plus size={16} /> Add category</Btn>
      </PageHeader>

      <Card>
        {!categories ? <p className="p-8 text-center text-sm text-gray-500">Loading…</p> : (
          <TableWrap>
            <thead><tr><Th>Category</Th><Th>Product types</Th><Th>Products</Th><Th>Order</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 bg-gray-100">{c.image?.url && <img src={c.image.url} alt="" className="h-full w-full object-cover" />}</div>
                      <div><p className="font-medium">{c.name}</p><p className="text-xs text-gray-400">{c.description}</p></div>
                    </div>
                  </Td>
                  <Td className="max-w-xs text-xs text-gray-500">{c.subCategories.join(', ') || '—'}</Td>
                  <Td><Link to={`/dashboard/list?category=${encodeURIComponent(c.name)}`} className="underline">{c.productCount}</Link></Td>
                  <Td>{c.sortOrder}</Td>
                  <Td>{c.active ? <span className="text-green-700">Visible</span> : <span className="text-gray-400">Hidden</span>}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => open(c)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100" title="Edit"><Pencil size={15} /></button>
                      <button type="button" onClick={() => remove(c)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add category' : `Edit ${editing?.name || ''}`}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name *"><input name="name" value={form.name} onChange={onChange} required maxLength={50} className={inputClass} /></Field>
          <Field label="Short description" hint="Shown on the homepage tile"><input name="description" value={form.description} onChange={onChange} maxLength={300} className={inputClass} /></Field>
          <Field label="Product types" hint="Comma separated, e.g. T-Shirts, Hoodies, Jackets"><textarea name="subCategories" value={form.subCategories} onChange={onChange} rows={3} className={`${inputClass} h-auto py-2`} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display order" hint="Lower numbers first"><input type="number" name="sortOrder" value={form.sortOrder} onChange={onChange} className={inputClass} /></Field>
            <label className="flex items-center gap-3 pt-6 text-sm"><input type="checkbox" name="active" checked={form.active} onChange={onChange} className="h-4 w-4 accent-black" /> Visible in store</label>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-600">Picture</p>
            <div className="flex items-start gap-4">
              <div className="h-28 w-24 shrink-0 bg-gray-100">{preview && <img src={preview} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex-1 space-y-3">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-gray-200 px-4 text-sm hover:bg-gray-50">
                  <ImagePlus size={16} /> Upload picture
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files[0] || null)} />
                </label>
                <input name="imageUrl" value={form.imageUrl} onChange={(e) => { setFile(null); onChange(e); }} placeholder="…or paste an image link" className={inputClass} />
              </div>
            </div>
          </div>
          {editing && editing !== 'new' && editing.name !== form.name && (
            <p className="bg-amber-50 p-3 text-xs text-amber-800">Renaming also moves its {editing.productCount} product(s) to the new name.</p>
          )}
          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</Btn>
            <Btn variant="light" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default Categories;
