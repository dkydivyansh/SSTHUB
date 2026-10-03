import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Campus, Order, OrderStatus, Category, Store, Product } from '../types';
import { effectivePrice } from '../data/mock';

const LS_CART = 'shop_cart_v1';
const LS_CAMPUS = 'shop_campus_v1';
const LS_ORDERS = 'shop_orders_v1';

export const FREE_DELIVERY_ABOVE = 199;
export const DELIVERY_FEE = 15;

interface ShopCtx {
  campus: Campus | null;
  setCampus: (c: Campus) => void;
  cart: Record<string, number>;
  add: (sku: string) => void;
  remove: (sku: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orders: Order[];
  placeOrder: (address: string, payment: 'COD' | 'UPI') => Order[];
  categories: Category[];
  stores: Store[];
  products: Product[];
  catalogLoading: boolean;
}

const Ctx = createContext<ShopCtx | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [campus, setCampusState] = useState<Campus | null>(() => read<Campus | null>(LS_CAMPUS, null));
  const [cart, setCart] = useState<Record<string, number>>(() => read(LS_CART, {}));
  const [orders, setOrders] = useState<Order[]>(() => read(LS_ORDERS, []));
  const [catalog, setCatalog] = useState<{ categories: Category[], stores: Store[], products: Product[] }>({ categories: [], stores: [], products: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shop_catalog')
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setCatalog(d.data); })
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => localStorage.setItem(LS_CART, JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem(LS_ORDERS, JSON.stringify(orders)), [orders]);

  const setCampus = (c: Campus) => {
    localStorage.setItem(LS_CAMPUS, JSON.stringify(c));
    setCampusState(c);
  };

  const add = useCallback((sku: string) => {
    const p = catalog.products.find(x => x.sku === sku);
    if (!p) return;
    setCart(c => ((c[sku] || 0) >= p.quantity ? c : { ...c, [sku]: (c[sku] || 0) + 1 }));
  }, [catalog]);

  const remove = useCallback((sku: string) => {
    setCart(c => {
      const n = { ...c };
      if ((n[sku] || 0) <= 1) delete n[sku];
      else n[sku] -= 1;
      return n;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const { count, subtotal } = useMemo(() => {
    let count = 0, subtotal = 0;
    for (const [sku, qty] of Object.entries(cart)) {
      const p = catalog.products.find(x => x.sku === sku);
      if (!p) continue;
      count += qty;
      subtotal += effectivePrice(p as any) * qty;
    }
    return { count, subtotal };
  }, [cart, catalog]);

  const deliveryFee = count === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  /** Splits the cart into one order per store (see SHOP_PLAN.md §2.7). */
  const placeOrder = (address: string, payment: 'COD' | 'UPI') => {
    const byStore = new Map<number, Order['lines']>();
    for (const [sku, qty] of Object.entries(cart)) {
      const p = catalog.products.find(x => x.sku === sku);
      if (!p) continue;
      const lines = byStore.get(p.store_id) || [];
      lines.push({ sku, title: p.title, price: effectivePrice(p as any), qty, image: p.featured_image });
      byStore.set(p.store_id, lines);
    }
    const created: Order[] = [];
    byStore.forEach((lines, storeId) => {
      const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const fee = sub >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
      created.push({
        id: 'SH' + Date.now().toString(36).toUpperCase() + storeId,
        placed_at: Date.now(),
        store_id: storeId,
        store_name: catalog.stores.find(s => s.id === storeId)?.name || 'Store',
        lines, subtotal: sub, delivery_fee: fee, total: sub + fee,
        payment_method: payment, address, status: 'placed' as OrderStatus,
      });
    });
    setOrders(o => [...created, ...o]);
    setCart({});
    return created;
  };

  return (
    <Ctx.Provider value={{ campus, setCampus, cart, add, remove, clear, count, subtotal, deliveryFee, total, orders, placeOrder, ...catalog, catalogLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useShop = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useShop must be used inside ShopProvider');
  return c;
};
