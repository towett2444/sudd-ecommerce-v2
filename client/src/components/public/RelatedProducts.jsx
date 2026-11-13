import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import ProductItem from './ProductItem';
import { getProducts } from '../../services/product.service';

const RelatedProducts = ({ product }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatedProducts = async () => {
    setLoading(true);

    try {
      const data = await getProducts();

      if (!data.success) {
        setRelatedProducts([]);
        return;
      }

      const products = data.products || [];

      // Products from the same subcategory
      const sameSubCategory = products.filter(
        (item) =>
          item._id !== product._id && item.subCategory === product.subCategory,
      );

      // Other products from the same category
      const sameCategory = products.filter(
        (item) =>
          item._id !== product._id &&
          item.category === product.category &&
          item.subCategory !== product.subCategory,
      );

      // Prioritize closest matches
      const related = [...sameSubCategory, ...sameCategory].slice(0, 4);

      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to fetch related products:', error);

      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product?._id) {
      fetchRelatedProducts();
    }
  }, [product?._id]);

  if (loading) {
    return null;
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-gray-200 pt-16 sm:mt-24 sm:pt-20">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            You may also like
          </p>

          <h2 className="text-2xl font-medium tracking-tight text-gray-950 sm:text-3xl">
            Related products
          </h2>
        </div>

        <Link
          to="/collection"
          className="group hidden items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-black sm:flex"
        >
          View all
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {relatedProducts.map((relatedProduct) => (
          <ProductItem key={relatedProduct._id} product={relatedProduct} />
        ))}
      </div>

      {/* Mobile View All */}
      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          to="/collection"
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          View all
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

export default RelatedProducts;
