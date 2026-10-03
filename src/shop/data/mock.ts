import type { Category, Product, Store, Campus } from '../types';

/** Builds an inline SVG data-URI "image" from an emoji so mock data has working images. */
export const emojiImg = (emoji: string, bg: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/><text x="100" y="125" font-size="96" text-anchor="middle">${emoji}</text></svg>`
  );

const ALL: Campus[] = ['UNI1', 'UNI2', 'OLD_CAMPUS', 'NEW_CAMPUS'];

export const CATEGORIES: Category[] = [
  { id: 1, slug: 'fruits-veg', name: 'Fruits & Veggies', description: 'Fresh produce', image: emojiImg('🥦', '#bbf7d0'), parent_id: null },
  { id: 2, slug: 'dairy', name: 'Dairy & Eggs', description: 'Milk, curd, eggs', image: emojiImg('🥛', '#bfdbfe'), parent_id: null },
  { id: 3, slug: 'snacks', name: 'Snacks', description: 'Chips, namkeen, biscuits', image: emojiImg('🍿', '#fde68a'), parent_id: null },
  { id: 4, slug: 'beverages', name: 'Drinks', description: 'Cold drinks, juices, energy', image: emojiImg('🥤', '#fecaca'), parent_id: null },
  { id: 5, slug: 'instant', name: 'Instant Food', description: 'Noodles, pasta, ready meals', image: emojiImg('🍜', '#fed7aa'), parent_id: null },
  { id: 6, slug: 'stationery', name: 'Stationery', description: 'Pens, notebooks, lab needs', image: emojiImg('✏️', '#e9d5ff'), parent_id: null },
  { id: 7, slug: 'personal-care', name: 'Personal Care', description: 'Hygiene & grooming', image: emojiImg('🧴', '#fbcfe8'), parent_id: null },
  { id: 8, slug: 'bakery', name: 'Bakery', description: 'Bread, buns, cakes', image: emojiImg('🍞', '#fef3c7'), parent_id: null },
];

export const STORES: Store[] = [
  {
    id: 1, name: 'Campus Mart', description: 'Daily groceries, snacks & essentials delivered to your hostel.',
    logo: emojiImg('🛒', '#3B82F6'), banner: emojiImg('🛒', '#93c5fd'), campus: ALL,
    opens_at: '07:00', closes_at: '23:00', is_open: true, categories: [1, 2, 3, 4, 5, 8],
    featured: ['MILK-AM-500', 'MAGGI-4', 'LAYS-MAG-52', 'COKE-750'],
  },
  {
    id: 2, name: 'Night Owl Canteen', description: 'Late-night instant food and drinks for those all-nighters.',
    logo: emojiImg('🦉', '#a78bfa'), banner: emojiImg('🌙', '#ddd6fe'), campus: ['UNI1', 'UNI2', 'NEW_CAMPUS'],
    opens_at: '18:00', closes_at: '03:00', is_open: true, categories: [3, 4, 5],
    featured: ['CUPNOOD-1', 'REDBULL-250'],
  },
  {
    id: 3, name: 'Paper Trail', description: 'Stationery, lab records and exam-week survival kits.',
    logo: emojiImg('📚', '#f472b6'), banner: emojiImg('📝', '#fbcfe8'), campus: ['OLD_CAMPUS', 'NEW_CAMPUS'],
    opens_at: '09:00', closes_at: '20:00', is_open: false, categories: [6, 7],
    featured: ['NOTE-A4-200', 'PEN-GEL-5'],
  },
];

type P = Omit<Product, 'id' | 'gallery'> & { gallery?: string[] };
const mk = (id: number, p: P): Product => ({ id, gallery: [p.featured_image], ...p });

export const PRODUCTS: Product[] = [
  mk(1, { sku: 'MILK-AM-500', store_id: 1, title: 'Amul Taaza Toned Milk', description: 'Fresh pasteurised toned milk pouch.', price: 29, discounted_price: 27, quantity: 40, unit: '500 ml', available_to: ALL, info: { type: 'Toned', fat: '3%', shelf_life: '2 days' }, featured_image: emojiImg('🥛', '#bfdbfe'), categories: [2] }),
  mk(2, { sku: 'EGG-6', store_id: 1, title: 'Farm Fresh Eggs', description: 'Protein-rich white eggs, tray of 6.', price: 54, discounted_price: 48, quantity: 25, unit: '6 pcs', available_to: ALL, info: { type: 'White', origin: 'Local farm' }, featured_image: emojiImg('🥚', '#fef9c3'), categories: [2] }),
  mk(3, { sku: 'CURD-400', store_id: 1, title: 'Fresh Dahi', description: 'Thick creamy curd cup.', price: 40, discounted_price: null, quantity: 18, unit: '400 g', available_to: ['UNI1', 'UNI2', 'OLD_CAMPUS'], info: { type: 'Full cream' }, featured_image: emojiImg('🍶', '#e0f2fe'), categories: [2] }),
  mk(4, { sku: 'BANANA-6', store_id: 1, title: 'Robusta Bananas', description: 'Ripe bananas, perfect pre-lecture fuel.', price: 45, discounted_price: 39, quantity: 30, unit: '6 pcs', available_to: ALL, info: { type: 'Organic', origin: 'Kerala' }, featured_image: emojiImg('🍌', '#fef08a'), categories: [1] }),
  mk(5, { sku: 'APPLE-4', store_id: 1, title: 'Shimla Apples', description: 'Crisp red apples.', price: 120, discounted_price: 99, quantity: 12, unit: '4 pcs', available_to: ALL, info: { type: 'Organic', origin: 'Shimla' }, featured_image: emojiImg('🍎', '#fecaca'), categories: [1] }),
  mk(6, { sku: 'TOMATO-500', store_id: 1, title: 'Tomatoes', description: 'Juicy hybrid tomatoes.', price: 25, discounted_price: null, quantity: 0, unit: '500 g', available_to: ALL, info: { type: 'Hybrid' }, featured_image: emojiImg('🍅', '#fecdd3'), categories: [1] }),
  mk(7, { sku: 'LAYS-MAG-52', store_id: 1, title: "Lay's Magic Masala", description: 'Crispy potato chips with a masala twist.', price: 20, discounted_price: null, quantity: 80, unit: '52 g', available_to: ALL, info: { flavor: 'Magic Masala', type: 'Veg' }, featured_image: emojiImg('🥔', '#fde68a'), categories: [3] }),
  mk(8, { sku: 'OREO-120', store_id: 1, title: 'Oreo Cream Biscuits', description: 'Chocolate sandwich biscuits.', price: 40, discounted_price: 36, quantity: 60, unit: '120 g', available_to: ALL, info: { flavor: 'Vanilla cream', type: 'Veg' }, featured_image: emojiImg('🍪', '#d6d3d1'), categories: [3] }),
  mk(9, { sku: 'COKE-750', store_id: 1, title: 'Coca-Cola', description: 'Chilled cola bottle.', price: 45, discounted_price: 40, quantity: 50, unit: '750 ml', available_to: ALL, info: { flavor: 'Cola', type: 'Carbonated' }, featured_image: emojiImg('🥤', '#fecaca'), categories: [4] }),
  mk(10, { sku: 'FRUITY-200', store_id: 1, title: 'Frooti Mango Drink', description: 'Mango drink tetra pack.', price: 20, discounted_price: null, quantity: 70, unit: '200 ml', available_to: ALL, info: { flavor: 'Mango' }, featured_image: emojiImg('🧃', '#fed7aa'), categories: [4] }),
  mk(11, { sku: 'MAGGI-4', store_id: 1, title: 'Maggi 2-Minute Noodles', description: 'Pack of 4 masala noodles.', price: 56, discounted_price: 52, quantity: 90, unit: '4 x 70 g', available_to: ALL, info: { flavor: 'Masala', type: 'Veg' }, featured_image: emojiImg('🍜', '#fed7aa'), categories: [5] }),
  mk(12, { sku: 'BREAD-WH-400', store_id: 1, title: 'Whole Wheat Bread', description: 'Soft sliced brown bread.', price: 45, discounted_price: null, quantity: 22, unit: '400 g', available_to: ALL, info: { type: 'Whole wheat' }, featured_image: emojiImg('🍞', '#fef3c7'), categories: [8] }),
  mk(13, { sku: 'CUPNOOD-1', store_id: 2, title: 'Cup Noodles Spicy', description: 'Just add hot water.', price: 60, discounted_price: 55, quantity: 35, unit: '70 g', available_to: ['UNI1', 'UNI2', 'NEW_CAMPUS'], info: { flavor: 'Spicy', type: 'Veg' }, featured_image: emojiImg('🍲', '#fdba74'), categories: [5] }),
  mk(14, { sku: 'REDBULL-250', store_id: 2, title: 'Red Bull Energy', description: 'Energy drink for the all-nighters.', price: 125, discounted_price: 115, quantity: 20, unit: '250 ml', available_to: ['UNI1', 'UNI2', 'NEW_CAMPUS'], info: { type: 'Energy', caffeine: '80 mg' }, featured_image: emojiImg('⚡', '#bae6fd'), categories: [4] }),
  mk(15, { sku: 'NOTE-A4-200', store_id: 3, title: 'A4 Ruled Notebook', description: '200 pages, spiral bound.', price: 90, discounted_price: 80, quantity: 45, unit: '200 pgs', available_to: ['OLD_CAMPUS', 'NEW_CAMPUS'], info: { type: 'Ruled', size: 'A4' }, featured_image: emojiImg('📓', '#e9d5ff'), categories: [6] }),
  mk(16, { sku: 'PEN-GEL-5', store_id: 3, title: 'Gel Pens (Pack of 5)', description: 'Smooth blue gel pens.', price: 50, discounted_price: null, quantity: 100, unit: '5 pcs', available_to: ['OLD_CAMPUS', 'NEW_CAMPUS'], info: { type: 'Gel', ink: 'Blue' }, featured_image: emojiImg('🖊️', '#ddd6fe'), categories: [6] }),
];

export const getProduct = (sku: string) => PRODUCTS.find(p => p.sku === sku);
export const getStore = (id: number) => STORES.find(s => s.id === id);
export const getCategory = (slug: string) => CATEGORIES.find(c => c.slug === slug);
export const effectivePrice = (p: Product) => p.discounted_price ?? p.price;
export const discountPct = (p: Product) =>
  p.discounted_price && p.discounted_price < p.price ? Math.round(((p.price - p.discounted_price) / p.price) * 100) : 0;
