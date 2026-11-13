import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductItem from './ProductItem';
import { getProducts } from '../../services/product.service';
import { useEffect, useState } from 'react';

const BestSeller = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const data = await getProducts();

      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const bestSellers = products
    .filter((product) => product.bestseller)
    .slice(0, 4);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Nothing to show until a product is marked as a bestseller
  if (bestSellers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20">
      {/* Section Header */}
      <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            Most loved
          </p>

          <h2 className="text-2xl font-medium tracking-tight text-gray-950 sm:text-3xl">
            Best sellers
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
            Our most popular picks, chosen by Sudd Shop customers.
          </p>
        </div>

        {/* Desktop View All */}
        <Link
          to="/collection"
          className="group hidden items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-black sm:flex"
        >
          Shop best sellers
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {bestSellers.map((product) => (
          <ProductItem key={product._id} product={product} />
        ))}
      </div>

      {/* Mobile View All */}
      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          to="/collection"
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          Shop best sellers
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
};

export default BestSeller;
