// Store-wide settings: delivery zones and fees, counties, stock rules.
// Change the numbers here to change what customers are charged.

export const CURRENCY = 'KES';

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo',
  'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale',
  'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
  'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot',
];

// The first zone whose list contains the county is used; the last zone catches everything else.
export const DELIVERY_ZONES = [
  { id: 'nairobi', name: 'Nairobi', counties: ['Nairobi'], fee: 250, days: '1–2 days' },
  {
    id: 'metro',
    name: 'Nairobi metro',
    counties: ['Kiambu', 'Machakos', 'Kajiado', "Murang'a"],
    fee: 350,
    days: '1–3 days',
  },
  {
    id: 'towns',
    name: 'Major towns',
    counties: ['Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Nyeri', 'Meru', 'Kakamega', 'Kilifi', 'Kericho', 'Embu'],
    fee: 450,
    days: '2–4 days',
  },
  { id: 'rest', name: 'Rest of Kenya', counties: [], fee: 600, days: '3–5 days' },
];

// Orders whose subtotal reaches this amount get free delivery (set to null to turn off).
export const FREE_DELIVERY_OVER = 10000;

export const deliveryQuote = (county, subtotal = 0) => {
  const zone =
    DELIVERY_ZONES.find((z) => z.counties.includes(county)) || DELIVERY_ZONES[DELIVERY_ZONES.length - 1];
  const free = FREE_DELIVERY_OVER != null && subtotal >= FREE_DELIVERY_OVER;
  return { zone: zone.name, days: zone.days, fee: free ? 0 : zone.fee, free };
};

// Unpaid M-Pesa / card orders are cancelled after this many minutes and their stock released.
export const UNPAID_ORDER_TIMEOUT_MINUTES = 120;

export const DEFAULT_LOW_STOCK = 5;
