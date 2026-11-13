import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import useAuth from '../../hooks/useAuth';
import { dateOnly, errorMessage } from '../../lib/format';
import { deleteReview, getMyReview, getReviews, saveReview } from '../../services/shop.service';
import { StarPicker, Stars } from './Stars';

// Ratings summary, review list and the "write a review" form on the product page.
const Reviews = ({ product, onRatingChange }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState({ reviews: [], total: 0, breakdown: {}, pages: 1 });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [mine, setMine] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getReviews(product._id, { page, sort, limit: 5 });
      setData(d);
    } catch {
      // reviews are optional; keep the page usable
    }
  }, [product._id, page, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    getMyReview(product._id).then((d) => {
      setMine(d.review);
      setPurchased(d.purchased);
      if (d.review) setForm({ rating: d.review.rating, title: d.review.title, comment: d.review.comment });
    }).catch(() => {});
  }, [user, product._id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error('Choose a star rating.');
    setSaving(true);
    try {
      const r = await saveReview(product._id, form);
      toast.success(r.message);
      setMine(r.review);
      setEditing(false);
      const d = await getReviews(product._id, { page: 1, sort, limit: 5 });
      setData(d);
      setPage(1);
      const total = Object.entries(d.breakdown).reduce((s, [k, n]) => s + Number(k) * n, 0);
      onRatingChange?.(d.total ? Math.round((total / d.total) * 10) / 10 : 0, d.total);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save your review.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await deleteReview(mine._id);
      setMine(null);
      setForm({ rating: 0, title: '', comment: '' });
      toast.success('Review deleted.');
      const d = await getReviews(product._id, { page: 1, sort, limit: 5 });
      setData(d);
      const total = Object.entries(d.breakdown).reduce((s, [k, n]) => s + Number(k) * n, 0);
      onRatingChange?.(d.total ? Math.round((total / d.total) * 10) / 10 : 0, d.total);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const showForm = user && (!mine || editing);

  return (
    <section id="reviews" className="mt-20 scroll-mt-24 border-t border-gray-200 pt-12">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-gray-950">Customer reviews</h2>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-4xl font-semibold text-gray-950">{data.total ? product.ratingAverage.toFixed(1) : '–'}</span>
            <div>
              <Stars value={product.ratingAverage} size={16} />
              <p className="mt-1 text-xs text-gray-500">{data.total} review{data.total === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = data.breakdown?.[n] || 0;
              return (
                <div key={n} className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="w-10">{n} star</span>
                  <div className="h-2 flex-1 overflow-hidden bg-gray-100">
                    <div className="h-full bg-amber-500" style={{ width: `${data.total ? (count / data.total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {!user && (
            <p className="mt-6 text-sm text-gray-500">
              <Link to="/login" state={{ from: location.pathname }} className="font-medium text-black underline">Sign in</Link> to write a review.
            </p>
          )}

          {user && mine && !editing && (
            <div className="mt-6 border border-gray-200 p-4 text-sm">
              <p className="font-medium text-gray-900">Your review</p>
              <Stars value={mine.rating} className="mt-2" />
              <div className="mt-3 flex gap-4 text-xs">
                <button type="button" onClick={() => setEditing(true)} className="cursor-pointer underline">Edit</button>
                <button type="button" onClick={remove} className="cursor-pointer text-red-600 underline">Delete</button>
              </div>
            </div>
          )}

          {showForm && (
            <form onSubmit={submit} className="mt-6 space-y-4 border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-900">{mine ? 'Edit your review' : 'Write a review'}</p>
              {!purchased && <p className="text-xs text-gray-400">Reviews from customers who received this item are marked "Verified purchase".</p>}
              <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={100}
                placeholder="Title (optional)" className="input" aria-label="Review title" />
              <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} maxLength={2000} rows={4}
                placeholder="What did you like or dislike?" className="input py-3" aria-label="Review" />
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="cursor-pointer bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {saving ? 'Saving…' : 'Submit review'}
                </button>
                {editing && <button type="button" onClick={() => setEditing(false)} className="cursor-pointer px-3 text-sm text-gray-500">Cancel</button>}
              </div>
            </form>
          )}
        </div>

        <div>
          {data.total > 0 && (
            <div className="mb-4 flex justify-end">
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort reviews"
                className="h-10 cursor-pointer border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none">
                <option value="newest">Newest</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          )}

          {data.reviews.length === 0 ? (
            <p className="border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.reviews.map((r) => (
                <li key={r._id} className="py-6 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={r.rating} />
                    <span className="text-xs text-gray-400">{dateOnly(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="mt-3 text-sm font-medium text-gray-900">{r.title}</p>}
                  {r.comment && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">{r.comment}</p>}
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    {r.name}
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-green-700"><BadgeCheck size={13} /> Verified purchase</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {data.pages > 1 && (
            <div className="mt-6 flex items-center gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer border border-gray-200 px-3 py-2 disabled:opacity-40">Previous</button>
              <span className="text-gray-500">Page {page} of {data.pages}</span>
              <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer border border-gray-200 px-3 py-2 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
