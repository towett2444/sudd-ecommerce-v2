import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { searchProducts } from '../../services/shop.service';
import ProductItem from './ProductItem';

// A homepage row of products loaded with the given search params (featured, onSale, sort...).
const ProductRail = ({ eyebrow, title, text, params, linkTo = '/collection', linkLabel = 'View all', limit = 8, accent }) => {
  const [products, setProducts] = useState(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    searchProducts({ ...JSON.parse(key), limit })
      .then((d) => alive && setProducts(d.products || []))
      .catch(() => alive && setProducts([]));
    return () => { alive = false; };
  }, [key, limit]);

  if (products && products.length === 0) return null;

  return (
    <section className="py-14 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
        <div>
          <p className={`mb-2 text-xs font-medium uppercase tracking-[0.2em] ${accent || 'text-gray-500'}`}>{eyebrow}</p>
          <h2 className="text-2xl font-medium tracking-tight text-gray-950 sm:text-3xl">{title}</h2>
          {text && <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">{text}</p>}
        </div>
        <Link to={linkTo} className="group hidden shrink-0 items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-black sm:flex">
          {linkLabel}
          <ArrowRight size={16} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {products
          ? products.map((product) => <ProductItem key={product._id} product={product} />)
          : Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-4/5 bg-gray-100" />
                <div className="mt-3 h-3 w-2/3 bg-gray-100" />
                <div className="mt-2 h-3 w-1/3 bg-gray-100" />
              </div>
            ))}
      </div>

      <div className="mt-10 flex justify-center sm:hidden">
        <Link to={linkTo} className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900">
          {linkLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};

export default ProductRail;
