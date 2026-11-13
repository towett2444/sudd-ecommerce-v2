import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import ProductItem from '../../components/public/ProductItem';
import { Stars } from '../../components/public/Stars';
import { collectionBanner } from '../../data/images';
import { getCategories, getFacets, searchProducts } from '../../services/shop.service';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Best selling'],
  ['rating', 'Top rated'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];

const listParam = (params, key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : []);

// The shop. All filters live in the URL, so results can be shared and the back button works.
// `offers` shows only discounted products (the /offers page).
const Collection = ({ offers = false }) => {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [result, setResult] = useState({ products: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ subCategories: [], sizes: [], price: { min: 0, max: 0 } });
  const [searchText, setSearchText] = useState(params.get('q') || '');
  const [priceDraft, setPriceDraft] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  const q = params.get('q') || '';
  const selectedCategories = listParam(params, 'category');
  const selectedSubs = listParam(params, 'subCategory');
  const selectedSizes = listParam(params, 'size');
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    getCategories().then((d) => setCategories(d.categories || [])).catch(() => {});
    getFacets().then(setFacets).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchText(q);
    setPriceDraft({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  }, [params, q]);

  const queryKey = params.toString();
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const query = Object.fromEntries(new URLSearchParams(queryKey));
    if (offers) query.onSale = 'true';
    searchProducts({ ...query, limit: 24 })
      .then((d) => alive && setResult(d))
      .catch((e) => alive && setError(e.response?.data?.message || 'Could not load products.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [queryKey, offers]);

  // Changes some params and goes back to page 1.
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : String(v));
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const toggle = (key, list, value) => update({ [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });

  const clearAll = () => setParams(q ? { q } : {});

  // Product types offered by the chosen categories (or all)
  const subOptions = selectedCategories.length
    ? [...new Set(categories.filter((c) => selectedCategories.includes(c.name)).flatMap((c) => c.subCategories))]
    : facets.subCategories.map((s) => s.name);

  const activeCount =
    selectedCategories.length + selectedSubs.length + selectedSizes.length +
    ['minPrice', 'maxPrice', 'inStock', 'onSale', 'minRating', 'featured'].filter((k) => params.get(k)).length;

  const title = offers
    ? 'Special offers'
    : q
      ? `Results for "${q}"`
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : params.get('featured') ? 'Featured' : 'Shop all';

  const filters = (
    <>
      {!offers && (
        <FilterGroup title="Category">
          {categories.map((c) => (
            <FilterCheckbox key={c._id} label={c.name} count={c.productCount} checked={selectedCategories.includes(c.name)}
              onChange={() => toggle('category', selectedCategories, c.name)} />
          ))}
        </FilterGroup>
      )}

      {subOptions.length > 0 && (
        <FilterGroup title="Product type">
          {subOptions.map((s) => (
            <FilterCheckbox key={s} label={s} checked={selectedSubs.includes(s)} onChange={() => toggle('subCategory', selectedSubs, s)} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Price (KSh)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); update({ minPrice: priceDraft.min, maxPrice: priceDraft.max }); }}
        >
          <input type="number" min="0" inputMode="numeric" placeholder={String(facets.price.min || 'Min')} value={priceDraft.min}
            onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
            className="h-10 w-full border border-gray-200 px-2 text-sm outline-none focus:border-gray-500" aria-label="Minimum price" />
          <span className="text-gray-400">–</span>
          <input type="number" min="0" inputMode="numeric" placeholder={String(facets.price.max || 'Max')} value={priceDraft.max}
            onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
            className="h-10 w-full border border-gray-200 px-2 text-sm outline-none focus:border-gray-500" aria-label="Maximum price" />
          <button type="submit" className="h-10 shrink-0 cursor-pointer bg-black px-3 text-xs font-medium text-white">Go</button>
        </form>
      </FilterGroup>

      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button key={s.name} type="button" onClick={() => toggle('size', selectedSizes, s.name)}
                className={`min-w-10 cursor-pointer border px-2.5 py-1.5 text-xs transition ${selectedSizes.includes(s.name) ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Rating">
        {[4, 3].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 text-sm text-gray-600 hover:text-black">
            <input type="radio" name="rating" checked={params.get('minRating') === String(r)} onChange={() => update({ minRating: r })} className="h-4 w-4 accent-black" />
            <Stars value={r} size={13} /> &amp; up
          </label>
        ))}
        {params.get('minRating') && (
          <button type="button" onClick={() => update({ minRating: '' })} className="cursor-pointer self-start text-xs text-gray-500 underline">Any rating</button>
        )}
      </FilterGroup>

      <FilterGroup title="Availability & deals">
        <FilterCheckbox label="In stock only" checked={params.get('inStock') === 'true'} onChange={() => update({ inStock: params.get('inStock') ? '' : 'true' })} />
        {!offers && (
          <FilterCheckbox label="On sale" count={facets.onSaleCount} checked={params.get('onSale') === 'true'} onChange={() => update({ onSale: params.get('onSale') ? '' : 'true' })} />
        )}
        <FilterCheckbox label="Featured" checked={params.get('featured') === 'true'} onChange={() => update({ featured: params.get('featured') ? '' : 'true' })} />
      </FilterGroup>
    </>
  );

  const sortSelect = (
    <div className="relative">
      <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort products"
        className="h-11 cursor-pointer appearance-none border border-gray-200 bg-white pl-4 pr-9 text-sm text-gray-700 outline-none transition focus:border-gray-400">
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
    </div>
  );

  return (
    <main className="py-10 sm:py-14">
      <div className="mb-10 border-b border-gray-200 pb-8 sm:mb-12">
        <div className="relative overflow-hidden">
          <img src={collectionBanner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className={`absolute inset-0 ${offers ? 'bg-gradient-to-r from-red-900/80 via-red-800/50 to-transparent' : 'bg-gradient-to-r from-black/65 via-black/35 to-transparent'}`} />
          <div className="relative px-6 py-12 sm:px-10 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">{offers ? 'Limited time' : 'Shop'}</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
              {offers ? 'Discounted prices on selected items while stocks last.' : 'Clothing, footwear and everyday accessories for simple, effortless style.'}
            </p>
          </div>
        </div>

        <form className="relative mt-7 w-full max-w-2xl" onSubmit={(e) => { e.preventDefault(); update({ q: searchText.trim() }); }} role="search">
          <Search size={19} strokeWidth={1.7} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search products…"
            className="h-12 w-full border border-gray-200 bg-white pl-12 pr-24 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
            aria-label="Search products" />
          {q && (
            <button type="button" onClick={() => update({ q: '' })} className="absolute right-20 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 hover:text-black" aria-label="Clear search">
              <X size={17} strokeWidth={1.7} />
            </button>
          )}
          <button type="submit" className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 cursor-pointer bg-black px-4 text-xs font-medium text-white">Search</button>
        </form>
      </div>

      <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
        <button type="button" onClick={() => setShowFilters(true)}
          className="flex h-11 cursor-pointer items-center gap-2 border border-gray-200 px-4 text-sm font-medium text-gray-800 transition hover:border-gray-400">
          <SlidersHorizontal size={17} strokeWidth={1.8} />
          Filters
          {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] text-white">{activeCount}</span>}
        </button>
        {sortSelect}
      </div>

      <div className="flex items-start gap-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-sm font-medium text-gray-950">Filters</h2>
            {activeCount > 0 && <button type="button" onClick={clearAll} className="cursor-pointer text-xs text-gray-500 hover:text-black">Clear all</button>}
          </div>
          {filters}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-7 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500" aria-live="polite">
              {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'product' : 'products'}`}
            </p>
            <div className="hidden items-center gap-3 lg:flex">
              <span className="text-sm text-gray-500">Sort by</span>
              {sortSelect}
            </div>
          </div>

          {error ? (
            <p className="border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</p>
          ) : !loading && result.products.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center border border-gray-200 px-5 text-center">
              <Search size={25} strokeWidth={1.5} className="text-gray-300" />
              <h3 className="mt-4 text-base font-medium text-gray-900">{q ? `No results for "${q}"` : 'No products found'}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">Try another search term or clear your filters.</p>
              {(activeCount > 0 || q) && (
                <button type="button" onClick={() => setParams({})} className="mt-5 cursor-pointer border-b border-black pb-1 text-sm font-medium">Clear search and filters</button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-50' : ''}`}>
              {result.products.map((product) => <ProductItem key={product._id} product={product} />)}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pages">
              <button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })}
                className="flex h-10 cursor-pointer items-center gap-1 border border-gray-200 px-3 text-sm disabled:cursor-default disabled:opacity-40">
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="px-3 text-sm text-gray-500">Page {result.page} of {result.pages}</span>
              <button type="button" disabled={page >= result.pages} onClick={() => update({ page: page + 1 })}
                className="flex h-10 cursor-pointer items-center gap-1 border border-gray-200 px-3 text-sm disabled:cursor-default disabled:opacity-40">
                Next <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div onClick={() => setShowFilters(false)}
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 lg:hidden ${showFilters ? 'visible opacity-100' : 'invisible opacity-0'}`} />
      <aside className={`fixed bottom-0 left-0 top-0 z-70 w-[88%] max-w-sm overflow-y-auto bg-white transition-transform duration-300 ease-in-out lg:hidden ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!showFilters}>
        <div className="sticky top-0 z-10 flex h-18 items-center justify-between border-b border-gray-100 bg-white px-5">
          <h2 className="font-medium text-gray-950">Filters</h2>
          <button type="button" onClick={() => setShowFilters(false)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100" aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-28">{filters}</div>
        <div className="fixed bottom-0 left-0 w-[88%] max-w-sm border-t border-gray-100 bg-white p-4">
          <div className="flex gap-3">
            <button type="button" onClick={clearAll} className="flex-1 cursor-pointer border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50">Clear</button>
            <button type="button" onClick={() => setShowFilters(false)} className="flex-1 cursor-pointer bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800">
              View {result.total}
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
};

const FilterGroup = ({ title, children }) => (
  <div className="border-b border-gray-200 py-6">
    <h3 className="mb-4 text-sm font-medium text-gray-900">{title}</h3>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const FilterCheckbox = ({ label, checked, onChange, count }) => (
  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-600 transition hover:text-black">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 cursor-pointer accent-black" />
    <span className="flex-1">{label}</span>
    {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
  </label>
);

export default Collection;
