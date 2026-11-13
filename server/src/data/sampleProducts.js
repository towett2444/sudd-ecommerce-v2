// Starter catalogue so a new store isn't empty.
// Loaded automatically when the products collection is empty (see seedProducts.js).
// Photos are from Unsplash (free to use).

const photo = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['39', '40', '41', '42', '43', '44'];

const sampleProducts = [
  // ---------- Men ----------
  {
    name: 'Essential Cotton T-Shirt',
    description:
      'A soft everyday cotton t-shirt with a relaxed fit and clean finish. Easy to dress up or down.',
    price: 1800,
    category: 'Men',
    subCategory: 'T-Shirts',
    sizes: CLOTHING_SIZES,
    colors: ['White', 'Black', 'Gray'],
    image: '1521572163474-6864f9cf17ab',
    bestseller: true,
  },
  {
    name: 'Graphic Print T-Shirt',
    description:
      'Black crew-neck tee with a bold front print. Breathable cotton for all-day comfort.',
    price: 2000,
    category: 'Men',
    subCategory: 'T-Shirts',
    sizes: CLOTHING_SIZES,
    colors: ['Black'],
    image: '1503341504253-dff4815485f1',
  },
  {
    name: 'Everyday Pullover Hoodie',
    description:
      'A heavyweight fleece hoodie with a roomy hood and front pocket, made for relaxed everyday styling.',
    price: 3200,
    category: 'Men',
    subCategory: 'Hoodies',
    sizes: CLOTHING_SIZES,
    colors: ['Gray', 'Black'],
    image: '1556821840-3a63f95609a7',
    bestseller: true,
  },
  {
    name: 'Slim Fit Oxford Shirt',
    description:
      'A crisp light-blue Oxford shirt with a slim fit. Perfect for the office or an evening out.',
    price: 2800,
    category: 'Men',
    subCategory: 'Shirts',
    sizes: CLOTHING_SIZES,
    colors: ['Blue', 'White'],
    image: '1620012253295-c15cc3e65df4',
  },
  {
    name: 'Cotton Polo Shirt',
    description:
      'Classic short-sleeve polo in soft piqué cotton. A smart-casual staple in three colours.',
    price: 2400,
    category: 'Men',
    subCategory: 'Shirts',
    sizes: CLOTHING_SIZES,
    colors: ['Gray', 'Red', 'Blue'],
    image: '1602810318383-e386cc2a3ccf',
  },
  {
    name: 'Leather Biker Jacket',
    description:
      'A timeless black biker jacket with zip details and a fitted cut that gets better with wear.',
    price: 7500,
    category: 'Men',
    subCategory: 'Jackets',
    sizes: CLOTHING_SIZES,
    colors: ['Black'],
    image: '1551028719-00167b16eac5',
    bestseller: true,
  },
  {
    name: 'Checked Suit Blazer',
    description:
      'A tailored blue checked blazer with a modern slim cut. Pair it with jeans or matching trousers.',
    price: 8900,
    category: 'Men',
    subCategory: 'Jackets',
    sizes: CLOTHING_SIZES,
    colors: ['Blue'],
    image: '1594938298603-c8148c4dae35',
  },
  {
    name: 'Straight Leg Denim Jeans',
    description:
      'Mid-wash straight leg jeans in sturdy cotton denim with a comfortable mid rise.',
    price: 3500,
    category: 'Men',
    subCategory: 'Trousers',
    sizes: ['30', '32', '34', '36'],
    colors: ['Blue'],
    image: '1624378439575-d8705ad7ae80',
  },

  // ---------- Women ----------
  {
    name: 'Flowing Maxi Dress',
    description:
      'A floor-length red maxi dress with a full, flowing skirt that moves beautifully.',
    price: 4500,
    category: 'Women',
    subCategory: 'Dresses',
    sizes: ['S', 'M', 'L'],
    colors: ['Red'],
    image: '1595777457583-95e059d581b8',
    bestseller: true,
  },
  {
    name: 'Floral Print Midi Dress',
    description:
      'A cheerful floral midi dress with short sleeves and a fitted waist. Made for sunny days.',
    price: 3900,
    category: 'Women',
    subCategory: 'Dresses',
    sizes: ['S', 'M', 'L'],
    colors: ['Red'],
    image: '1572804013309-59a88b7e92f1',
  },
  {
    name: 'Beach Wrap Dress',
    description:
      'A light, airy wrap dress with a high slit. Ideal for holidays and warm evenings.',
    price: 4200,
    category: 'Women',
    subCategory: 'Dresses',
    sizes: ['S', 'M', 'L'],
    colors: ['Blue'],
    image: '1539008835657-9e8e9680c956',
  },
  {
    name: 'Embroidered Cotton Blouse',
    description:
      'A white cotton blouse with delicate floral embroidery and a relaxed collar.',
    price: 2600,
    category: 'Women',
    subCategory: 'Shirts',
    sizes: ['S', 'M', 'L'],
    colors: ['White'],
    image: '1564257631407-4deb1f99d992',
  },
  {
    name: 'Striped Button-Down Shirt',
    description:
      'A fitted striped shirt with long sleeves. Tuck it into a skirt or wear it loose.',
    price: 2500,
    category: 'Women',
    subCategory: 'Shirts',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'White'],
    image: '1583496661160-fb5886a0aaaa',
  },
  {
    name: 'Satin Bomber Jacket',
    description:
      'A rust satin bomber with ribbed cuffs and hem. Lightweight layering for any season.',
    price: 4800,
    category: 'Women',
    subCategory: 'Jackets',
    sizes: ['S', 'M', 'L'],
    colors: ['Brown'],
    image: '1591047139829-d91aecb6caea',
    bestseller: true,
  },
  {
    name: 'Classic Denim Jacket',
    description:
      'A timeless light-wash denim jacket designed for easy layering throughout the year.',
    price: 3900,
    category: 'Women',
    subCategory: 'Jackets',
    sizes: ['S', 'M', 'L'],
    colors: ['Blue'],
    image: '1543076447-215ad9ba6923',
  },
  {
    name: 'Wide Leg Striped Trousers',
    description:
      'High-waisted wide leg trousers with bold vertical stripes for a confident look.',
    price: 3400,
    category: 'Women',
    subCategory: 'Trousers',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'White'],
    image: '1509631179647-0177331693ae',
  },

  // ---------- Shoes ----------
  {
    name: 'Classic White Sneakers',
    description:
      'Clean low-top white sneakers with a cushioned sole. They go with everything.',
    price: 4200,
    category: 'Shoes',
    subCategory: 'Sneakers',
    sizes: SHOE_SIZES,
    colors: ['White'],
    image: '1608231387042-66d1773070a5',
    bestseller: true,
  },
  {
    name: 'Pastel Low-Top Sneakers',
    description:
      'Playful pastel sneakers with a chunky sole and soft padded collar.',
    price: 4600,
    category: 'Shoes',
    subCategory: 'Sneakers',
    sizes: SHOE_SIZES,
    colors: ['White', 'Blue'],
    image: '1595950653106-6c9ebd614d3a',
  },
  {
    name: 'Canvas Skate Shoes',
    description:
      'Durable maroon canvas shoes with a flat grippy sole, built for everyday wear.',
    price: 3800,
    category: 'Shoes',
    subCategory: 'Sneakers',
    sizes: SHOE_SIZES,
    colors: ['Red'],
    image: '1525966222134-fcfa99b8ae77',
  },
  {
    name: 'Colour Pop Trainers',
    description:
      'Lightweight running trainers with colourful laces and a breathable mesh upper.',
    price: 4900,
    category: 'Shoes',
    subCategory: 'Running Shoes',
    sizes: SHOE_SIZES,
    colors: ['White', 'Green'],
    image: '1560769629-975ec94e6a86',
  },
  {
    name: 'Leather Oxford Shoes',
    description:
      'Polished brown leather Oxfords with classic lace-up styling for formal occasions.',
    price: 6500,
    category: 'Shoes',
    subCategory: 'Formal Shoes',
    sizes: SHOE_SIZES,
    colors: ['Brown'],
    image: '1614252235316-8c857d38b5f4',
  },
  {
    name: 'Floral Stiletto Heels',
    description:
      'Statement pointed heels with a colourful floral pattern. Made to be noticed.',
    price: 5200,
    category: 'Shoes',
    subCategory: 'Heels',
    sizes: ['37', '38', '39', '40', '41'],
    colors: ['Blue', 'Red'],
    image: '1543163521-1bf539c55dd2',
    bestseller: true,
  },

  // ---------- Accessories ----------
  {
    name: 'Rattan Top-Handle Bag',
    description:
      'A woven rattan handbag with a leather handle and flap. A summer favourite.',
    price: 3600,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Brown'],
    image: '1590874103328-eac38a683ce7',
  },
  {
    name: 'Structured Leather Handbag',
    description:
      'A bright red structured handbag with gold hardware and a detachable strap.',
    price: 4800,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Red'],
    image: '1584917865442-de89df76afd3',
    bestseller: true,
  },
  {
    name: 'Vintage Leather Backpack',
    description:
      'A roomy backpack in soft brown leather with padded straps and a laptop sleeve.',
    price: 5900,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Brown'],
    image: '1622560480605-d83c853bc5c3',
  },
  {
    name: 'Minimal Everyday Backpack',
    description:
      'A lightweight navy backpack with a simple, functional design for work or school.',
    price: 3500,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Blue', 'Black'],
    image: '1553062407-98eeb64c6a62',
  },
  {
    name: 'Classic Leather Watch',
    description:
      'A minimalist watch with a clean white face and a brown leather strap.',
    price: 5500,
    category: 'Accessories',
    subCategory: 'Watches',
    sizes: [],
    colors: ['Brown'],
    image: '1524592094714-0f0654e20314',
    bestseller: true,
  },
  {
    name: 'Classic Black Sunglasses',
    description:
      'Lightweight sunglasses with a timeless frame and UV-protective lenses.',
    price: 1800,
    category: 'Accessories',
    subCategory: 'Sunglasses',
    sizes: [],
    colors: ['Black'],
    image: '1572635196237-14b3f281503f',
  },
  {
    name: 'Pendant Necklace',
    description:
      'A delicate gold-tone chain with a small pearl pendant. Simple and elegant.',
    price: 2200,
    category: 'Accessories',
    subCategory: 'Jewellery',
    sizes: [],
    colors: ['Gold'],
    image: '1611085583191-a3b181a88401',
  },
  {
    name: 'Everyday Baseball Cap',
    description:
      'A clean white cotton cap with an adjustable strap and curved brim.',
    price: 1200,
    category: 'Accessories',
    subCategory: 'Caps',
    sizes: [],
    colors: ['White'],
    image: '1588850561407-ed78c282e89b',
  },
];

// Sample stock levels, a few discounts and featured items so every part of the store has something to show.
const STOCK = [24, 12, 30, 8, 3, 18, 0, 40, 15, 6, 22, 9, 4, 35, 14, 7, 28, 11, 2, 19, 25, 10, 16, 5, 33, 13, 21, 3, 17, 26];

export default sampleProducts.map(({ image, ...product }, i) => ({
  ...product,
  sku: `SUD-${String(i + 1).padStart(4, '0')}`,
  bestseller: Boolean(product.bestseller),
  featured: i % 5 === 1,
  compareAtPrice: i % 4 === 2 ? Math.round((product.price * 1.25) / 100) * 100 : null,
  stock: STOCK[i % STOCK.length],
  inStock: STOCK[i % STOCK.length] > 0,
  active: true,
  images: [{ url: photo(image), fileId: `sample-${image}` }],
}));
