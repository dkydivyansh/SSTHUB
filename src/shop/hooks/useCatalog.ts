import { useMemo } from 'react';
import { PRODUCTS, STORES } from '../data/mock';
import { useShop } from '../context/ShopContext';

/** Products/stores visible for the selected campus (mirrors the future `FIND_IN_SET` API filter). */
export function useCatalog() {
  const { campus } = useShop();
  return useMemo(() => {
    const stores = STORES.filter(s => !campus || s.campus.includes(campus));
    const storeIds = new Set(stores.map(s => s.id));
    const products = PRODUCTS.filter(p => storeIds.has(p.store_id) && (!campus || p.available_to.includes(campus)));
    return { stores, products };
  }, [campus]);
}
