// Background and banner pictures used around the store.
// Photos are from Unsplash (free to use). To use your own, put the file in
// client/public/images/ and replace the link with '/images/your-file.jpg'.

const unsplash = (id, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const heroSlides = [
  {
    image: unsplash('1483985988355-763728e1935b', 2000),
    eyebrow: 'New arrivals',
    title: 'Find your everyday style.',
    text: 'Shop clothing, footwear and accessories selected for comfort, quality and everyday wear.',
    cta: 'Shop collection',
    to: '/collection',
  },
  {
    image: unsplash('1617137968427-85924c800a22', 2000),
    eyebrow: 'Men',
    title: 'Sharp looks for every day.',
    text: 'Shirts, jackets and essentials made to mix and match.',
    cta: 'Shop men',
    to: '/collection?category=Men',
  },
  {
    image: unsplash('1490481651871-ab68de25d43d', 2000),
    eyebrow: 'Women',
    title: 'Pieces you will love to wear.',
    text: 'Dresses, tops and layers for every season.',
    cta: 'Shop women',
    to: '/collection?category=Women',
  },
];

export const categoryImages = {
  Men: unsplash('1488161628813-04466f872be2', 900),
  Women: unsplash('1485968579580-b6d095142e6e', 900),
  Shoes: unsplash('1549298916-b41d501d3772', 900),
  Accessories: unsplash('1511499767150-a48a237f0083', 900),
};

export const promoBanner = unsplash('1512436991641-6745cdb1723f', 2000);
export const newsletterBackground = unsplash('1556905055-8f358a7a47b2', 2000);
export const loginImage = unsplash('1479064555552-3ef4979f8908', 1400);
export const aboutImage = unsplash('1441986300917-64674bd600d8', 1600);
export const collectionBanner = unsplash('1445205170230-053b83016050', 2000);
