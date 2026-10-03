export type Campus = 'UNI1' | 'UNI2' | 'OLD_CAMPUS' | 'NEW_CAMPUS';

export const CAMPUSES: { id: Campus; label: string }[] = [
  { id: 'UNI1', label: 'Uni 1' },
  { id: 'UNI2', label: 'Uni 2' },
  { id: 'OLD_CAMPUS', label: 'Old Campus' },
  { id: 'NEW_CAMPUS', label: 'New Campus' },
];

/** Mirrors `shop_categories` */
export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  parent_id: number | null;
}

/** Mirrors `shop_stores` (+ category ids, featured skus, owners) */
export interface Store {
  id: number;
  name: string;
  description: string;
  logo: string;
  banner: string;
  campus: Campus[];
  opens_at: string;
  closes_at: string;
  is_open: boolean;
  categories: number[];
  featured: string[]; // SKUs (shop_store_featured)
}

/** Mirrors `shop_products` (+ category ids) */
export interface Product {
  id: number;
  sku: string;
  store_id: number;
  title: string;
  description: string;
  price: number;
  discounted_price: number | null;
  quantity: number;
  unit: string;
  available_to: Campus[];
  info: Record<string, string>;
  featured_image: string;
  gallery: string[]; // max 10
  categories: number[];
}

export interface OrderLine {
  sku: string;
  title: string;
  price: number;
  qty: number;
  image: string;
}

export type OrderStatus = 'placed' | 'accepted' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  placed_at: number;
  store_id: number;
  store_name: string;
  lines: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'COD' | 'UPI';
  address: string;
  status: OrderStatus;
}
