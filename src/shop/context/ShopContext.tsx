import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Campus, Order, OrderStatus, Category, Store, Product } from '../types';
import { CAMPUSES } from '../types';
import { effectivePrice } from '../data/mock';

const LS_CART = 'shop_cart_v1';
const LS_CAMPUS = 'shop_campus_v1';
const LS_ORDERS = 'shop_orders_v1';

export const FREE_DELIVERY_ABOVE = 199;
export const DELIVERY_FEE = 15;

export interface StoreCharge { storeId: number; subtotal: number; fee: number; feeBase: number; freeAbove: number; }

export function storeDeliveryFee(store: Store | undefined, campus: Campus | null, subtotal: number) {
  const cfg = campus ? store?.delivery?.[campus] : undefined;
  const feeBase = cfg?.fee || 0, freeAbove = cfg?.free_above || 0;
  const fee = feeBase <= 0 || (freeAbove > 0 && subtotal >= freeAbove) ? 0 : feeBase;
  return { fee, feeBase, freeAbove };
}

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
  placeOrder: (address: string, mobile: string, note: string, payment: 'COD' | 'UPI') => Promise<void>;
  storeCharges: StoreCharge[];
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

  const refreshOrders = useCallback(async () => {
    try {
      const r = await fetch('/api/shop_order?action=my_orders');
      const d = await r.json();
      if (d.status === 'success') {
        setOrders(prev => {
          if (JSON.stringify(prev) === JSON.stringify(d.data)) return prev;
          return d.data;
        });
      }
    } catch (e) {
      // Ignore network errors on polling
    }
  }, []);

  useEffect(() => {
    fetch('/api/shop_catalog')
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setCatalog(d.data); })
      .finally(() => setCatalogLoading(false));
      
    let isCancelled = false;
    const poll = async () => {
      if (isCancelled) return;
      await refreshOrders();
      if (!isCancelled) setTimeout(poll, 5000);
    };
    poll();
    
    return () => { isCancelled = true; };
  }, [refreshOrders]);

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
      const s = catalog.stores.find(x => x.id === p.store_id);
      if (campus && !p.available_to.includes(campus)) continue;
      if (s && (!s.is_open || !s.is_active)) continue;
      count += qty;
      subtotal += effectivePrice(p as any) * qty;
    }
    return { count, subtotal };
  }, [cart, catalog, campus]);

  const storeCharges = useMemo<StoreCharge[]>(() => {
    const m = new Map<number, number>();
    for (const [sku, qty] of Object.entries(cart)) {
      const p = catalog.products.find(x => x.sku === sku);
      if (!p) continue;
      const s = catalog.stores.find(x => x.id === p.store_id);
      if (campus && !p.available_to.includes(campus)) continue;
      if (s && (!s.is_open || !s.is_active)) continue;
      m.set(p.store_id, (m.get(p.store_id) || 0) + effectivePrice(p as any) * qty);
    }
    return Array.from(m.entries()).map(([storeId, sub]) => ({
      storeId, subtotal: sub, ...storeDeliveryFee(catalog.stores.find(x => x.id === storeId), campus, sub),
    }));
  }, [cart, catalog, campus]);

  const deliveryFee = storeCharges.reduce((s, c) => s + c.fee, 0);
  const total = subtotal + deliveryFee;

  const placeOrder = async (address: string, mobile: string, note: string, payment: 'COD' | 'UPI') => {
    const freshRes = await fetch('/api/shop_catalog');
    const freshData = await freshRes.json();
    if (freshData.status !== 'success') throw new Error('Could not verify stock. Try again.');
    
    setCatalog(freshData.data);
    const freshCatalog = freshData.data;

    const validCart: Record<string, number> = {};
    for (const [sku, qty] of Object.entries(cart)) {
      const p = freshCatalog.products.find((x: any) => x.sku === sku);
      if (p && (!campus || p.available_to.includes(campus))) {
        const s = freshCatalog.stores.find((x: any) => x.id === p.store_id);
        if (s && s.is_open && s.is_active) {
          if (p.quantity < qty) throw new Error(`Not enough stock for ${p.title}. Only ${p.quantity} left.`);
          validCart[sku] = qty;
        } else {
          throw new Error(`Store ${s?.name || 'for an item'} is currently closed.`);
        }
      } else {
        throw new Error(`Some items are no longer available at your location.`);
      }
    }

    const campusLabel = CAMPUSES.find(c => c.id === campus)?.label || '';
    const fullAddress = address.trim() ? `${address}, ${campusLabel}` : campusLabel;

    const res = await fetch('/api/shop_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: validCart, address: fullAddress, mobile, note, payment_method: payment, campus })
    });
    
    const data = await res.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'Order failed');
    }
    
    setCart({});
    
    // Refresh orders
    fetch('/api/shop_order?action=my_orders')
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setOrders(d.data); });
      
    // Refresh catalog for updated stock
    fetch('/api/shop_catalog')
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setCatalog(d.data); });
  };

  return (
    <Ctx.Provider value={{ campus, setCampus, cart, add, remove, clear, count, subtotal, deliveryFee, total, orders, placeOrder, storeCharges, ...catalog, catalogLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useShop = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useShop must be used inside ShopProvider');
  return c;
};
