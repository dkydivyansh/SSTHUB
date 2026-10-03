import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, ListOrdered, Settings, LogOut } from 'lucide-react';

const API = '/api/shop_manage';

export default function ShopManageLayout() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    fetch(API + '?action=me')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setStore(d.data);
          if (pathname === '/shop-manage' || pathname === '/shop-manage/') nav('/shop-manage/orders', { replace: true });
        }
        else if (pathname !== '/shop-manage/admin') {
           // Not an owner, if not on admin route, redirect to shop
           nav('/shop', { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  if (loading) return <div className="min-h-screen bg-[#FFF5E1] flex items-center justify-center font-black uppercase text-xl animate-pulse">Loading...</div>;

  // If on admin page, render directly without the owner sidebar
  if (pathname.startsWith('/shop-manage/admin')) return <Outlet />;

  if (!store) return null;

  return (
    <div className="min-h-screen bg-[#FFF5E1] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col">
        <div className="p-4 border-b-4 border-black bg-yellow-300">
          <h1 className="text-2xl font-black uppercase tracking-tighter truncate flex items-center gap-2">
            <Store strokeWidth={3} /> {store?.name || 'Shop Manager'}
          </h1>
          <p className="font-bold text-sm mt-1">{store?.role === 'owner' ? 'Owner' : 'Manager'} • {store?.campus.join(', ')}</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link to="/shop-manage/products" className={`flex items-center gap-3 p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/products') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <ShoppingBag strokeWidth={3} /> Products
          </Link>
          <Link to="/shop-manage/orders" className={`flex items-center gap-3 p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/orders') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <ListOrdered strokeWidth={3} /> Orders
          </Link>
          <Link to="/shop-manage/settings" className={`flex items-center gap-3 p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/settings') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <Settings strokeWidth={3} /> Settings
          </Link>
        </nav>
        <div className="p-4 mt-auto">
          <Link to="/shop" className="flex items-center justify-center gap-2 w-full p-3 bg-red-500 text-white border-4 border-black font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">
            <LogOut size={18} strokeWidth={3} /> Exit Manager
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet context={{ store }} />
      </main>
    </div>
  );
}
