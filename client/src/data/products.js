export const products = [
  {
    _id: '1',
    name: 'Essential Cotton T-Shirt',
    description:
      'A soft everyday cotton t-shirt with a relaxed fit and clean finish.',
    price: 1800,
    category: 'Men',
    subCategory: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Gray'],

    image: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80',
    ],

    bestseller: true,
    inStock: true,
  },
  {
    _id: '2',
    name: 'Classic White Sneakers',
    description:
      'Clean and versatile sneakers designed for comfortable everyday wear.',
    price: 4200,
    category: 'Shoes',
    subCategory: 'Sneakers',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['White'],
    image: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: true,
    inStock: true,
  },
  {
    _id: '3',
    name: 'Everyday Hoodie',
    description:
      'A comfortable heavyweight hoodie made for relaxed everyday styling.',
    price: 3200,
    category: 'Men',
    subCategory: 'Hoodies',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Gray'],
    image: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
  {
    _id: '4',
    name: 'Minimal Backpack',
    description:
      'A lightweight everyday backpack with a simple and functional design.',
    price: 3500,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Black', 'Brown'],
    image: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
  {
    _id: '5',
    name: 'Classic Denim Jacket',
    description:
      'A timeless denim jacket designed for easy layering throughout the year.',
    price: 3900,
    category: 'Women',
    subCategory: 'Jackets',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue'],
    image: [
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: true,
    inStock: true,
  },
  {
    _id: '6',
    name: 'Casual Leather Sneakers',
    description:
      'Minimal casual sneakers with a comfortable sole for all-day wear.',
    price: 4500,
    category: 'Shoes',
    subCategory: 'Sneakers',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['Brown', 'Black'],
    image: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
  {
    _id: '7',
    name: 'Classic Sunglasses',
    description:
      'Lightweight sunglasses with a timeless frame and modern everyday look.',
    price: 1800,
    category: 'Accessories',
    subCategory: 'Sunglasses',
    sizes: [],
    colors: ['Black'],
    image: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: true,
    inStock: true,
  },
  {
    _id: '8',
    name: 'Minimal Wrist Watch',
    description:
      'A clean everyday watch featuring a minimalist face and versatile design.',
    price: 5500,
    category: 'Accessories',
    subCategory: 'Watches',
    sizes: [],
    colors: ['Black', 'Silver'],
    image: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: true,
    inStock: true,
  },
  {
    _id: '9',
    name: 'Relaxed Summer Shirt',
    description:
      'A lightweight relaxed-fit shirt designed for warm days and casual outfits.',
    price: 2600,
    category: 'Men',
    subCategory: 'Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Beige'],
    image: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
  {
    _id: '10',
    name: 'Everyday Tote Bag',
    description:
      'A spacious minimalist tote bag for work, shopping, and everyday essentials.',
    price: 2200,
    category: 'Accessories',
    subCategory: 'Bags',
    sizes: [],
    colors: ['Brown', 'Black'],
    image: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
  {
    _id: '11',
    name: 'Classic Running Shoes',
    description:
      'Comfortable lightweight shoes designed for active days and casual wear.',
    price: 4800,
    category: 'Shoes',
    subCategory: 'Running Shoes',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Black', 'White'],
    image: [
      'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: true,
    inStock: true,
  },
  {
    _id: '12',
    name: "Women's Everyday Dress",
    description:
      'A simple and elegant everyday dress with a comfortable relaxed silhouette.',
    price: 3600,
    category: 'Women',
    subCategory: 'Dresses',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Beige'],
    image: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
    ],
    bestseller: false,
    inStock: true,
  },
];
