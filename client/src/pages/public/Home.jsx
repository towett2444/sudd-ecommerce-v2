import Hero from '../../components/public/Hero';
import NewsLetter from '../../components/public/NewsLetter';
import ProductRail from '../../components/public/ProductRail';
import PromoBanner from '../../components/public/PromoBanner';
import ShopByCategory from '../../components/public/ShopByCategory';

const Home = () => {
  return (
    <div>
      <Hero />
      <ShopByCategory />
      <ProductRail
        eyebrow="Hand-picked"
        title="Featured products"
        text="Our team's favourite pieces this season."
        params={{ featured: true, sort: 'newest' }}
        linkTo="/collection?featured=true"
      />
      <ProductRail
        eyebrow="Special offers"
        accent="text-red-600"
        title="Deals & discounts"
        text="Limited-time prices on popular items — while stocks last."
        params={{ onSale: true, sort: 'newest' }}
        linkTo="/offers"
        linkLabel="See all offers"
      />
      <PromoBanner />
      <ProductRail
        eyebrow="Just in"
        title="New arrivals"
        text="The latest styles and everyday essentials added to the store."
        params={{ sort: 'newest' }}
        linkTo="/collection?sort=newest"
      />
      <ProductRail
        eyebrow="Most loved"
        title="Best sellers"
        text="Our most popular picks, chosen by customers."
        params={{ sort: 'popular' }}
        linkTo="/collection?sort=popular"
        linkLabel="Shop best sellers"
        limit={4}
      />
      <NewsLetter />
    </div>
  );
};

export default Home;
