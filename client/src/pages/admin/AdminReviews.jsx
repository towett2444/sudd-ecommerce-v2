import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, inputClass, PageHeader, Pager } from '../../components/admin/ui';
import { Stars } from '../../components/public/Stars';
import { dateTime, errorMessage } from '../../lib/format';
import { adminReviews, deleteReview } from '../../services/shop.service';

const AdminReviews = () => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    adminReviews({ page, rating, q }).then(setData).catch((e) => toast.error(errorMessage(e)));
  }, [page, rating, q]);
  useEffect(() => { load(); }, [load]);

  const remove = async (r) => {
    if (!window.confirm('Delete this review? The product rating will be recalculated.')) return;
    try {
      await deleteReview(r._id);
      toast.success('Review deleted.');
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" text="Read customer feedback and remove abusive or fake reviews." />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <form className="min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(e.target.elements.q.value); }}>
            <input name="q" defaultValue={q} placeholder="Search reviews…" className={inputClass} aria-label="Search reviews" />
          </form>
          <select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} className={`${inputClass} !w-auto`} aria-label="Rating">
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        {!data ? <p className="p-8 text-center text-sm text-gray-500">Loading…</p> : (
          <>
            <ul className="divide-y divide-gray-100">
              {data.reviews.map((r) => (
                <li key={r._id} className="flex gap-4 p-5">
                  <img src={r.product?.images?.[0]?.url} alt="" className="h-16 w-14 shrink-0 bg-gray-100 object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars value={r.rating} />
                      {r.product && <Link to={`/product/${r.product.slug}`} target="_blank" className="font-medium hover:underline">{r.product.name}</Link>}
                    </div>
                    {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                    {r.comment && <p className="mt-1 whitespace-pre-line text-gray-600">{r.comment}</p>}
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      {r.name} · {r.user?.email} · {dateTime(r.createdAt)}
                      {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-green-700"><BadgeCheck size={12} /> Verified</span>}
                    </p>
                  </div>
                  <button type="button" onClick={() => remove(r)} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete review">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {!data.reviews.length && <li className="p-12 text-center text-sm text-gray-500">No reviews yet.</li>}
            </ul>
            <Pager page={data.page} pages={data.pages} total={data.total} label="reviews" onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminReviews;
