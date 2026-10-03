import { Route, Routes } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import ShopLayout from './components/ShopLayout';
import ShopHome, { CategoriesPage } from './pages/ShopHome';
import { CategoryPage, SearchPage, StorePage, StoresPage } from './pages/Browse';
import ProductPage from './pages/ProductPage';
import { CartPage, OrdersPage } from './pages/CartOrders';

/**
 * Self-contained /shop module. Only the session (/api/profile) is shared with the main app.
 * Mounted from App.tsx via `<Route path="/shop/*" element={<ShopApp />} />`.
 */
export default function ShopApp() {
  return (
    <ShopProvider>
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<ShopHome />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="store/:id" element={<StorePage />} />
          <Route path="product/:sku" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="*" element={<div className="bg-white border-4 border-black p-10 text-center font-black uppercase">Page not found</div>} />
        </Route>
      </Routes>
    </ShopProvider>
  );
}
