import { useMemo } from 'react';
import { useShop } from '../context/ShopContext';

export function useCatalog() {
  const { campus, stores, products, categories, catalogLoading } = useShop();
  
  return useMemo(() => {
    const visibleStores = stores.filter(s => !campus || s.campus.includes(campus));
    const storeIds = new Set(visibleStores.map(s => s.id));
    const visibleProducts = products.filter(p => storeIds.has(p.store_id) && (!campus || p.available_to.includes(campus)));
    return { stores: visibleStores, products: visibleProducts, categories, catalogLoading };
  }, [campus, stores, products, categories, catalogLoading]);
}
