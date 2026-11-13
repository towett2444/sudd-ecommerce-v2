import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { categoryImages } from '../../data/images';
import { getCategories } from '../../services/shop.service';

// Category tiles, managed by the admin under Categories.
const ShopByCategory = () => {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    getCategories()
      .then((d) => setCategories((d.categories || []).filter((c) => c.productCount > 0)))
      .catch(() => setCategories([]));
  }, []);

  if (categories && categories.length === 0) return null;

  const cols = categories && categories.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <section className="pt-16 sm:pt-20">
      <div className="mb-8 sm:mb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Browse</p>
        <h2 className="text-2xl font-medium tracking-tight text-gray-950 sm:text-3xl">Shop by category</h2>
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${cols}`}>
        {(categories || Array.from({ length: 4 }, (_, i) => ({ _id: i }))).map((category) => {
          const image = category.image?.url || categoryImages[category.name];
          return category.name ? (
            <Link
              key={category._id}
              to={`/collection?category=${encodeURIComponent(category.name)}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-gray-200"
            >
              {image && (
                <img
                  src={image}
                  alt={category.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
                <h3 className="text-lg font-medium sm:text-2xl">{category.name}</h3>
                <p className="mt-1 hidden text-xs text-white/75 sm:block sm:text-sm">
                  {category.description || `${category.productCount} products`}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs font-medium sm:text-sm">
                  Shop now
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ) : (
            <div key={category._id} className="aspect-[3/4] animate-pulse bg-gray-100" />
          );
        })}
      </div>
    </section>
  );
};

export default ShopByCategory;
