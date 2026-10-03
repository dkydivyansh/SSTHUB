import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, ListOrdered, Settings, LogOut, Truck, Activity } from 'lucide-react';

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

  const refreshStore = async () => {
    try {
      const r = await fetch(API + '?action=me');
      const d = await r.json();
      if (d.status === 'success') {
        setStore((prev: any) => JSON.stringify(prev) === JSON.stringify(d.data) ? prev : d.data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!store) return;
    let isCancelled = false;
    const poll = async () => {
      if (isCancelled) return;
      await refreshStore();
      if (!isCancelled) setTimeout(poll, 5000);
    };
    // initial fetch is already done above, so schedule next one
    const timeout = setTimeout(poll, 5000);
    return () => { isCancelled = true; clearTimeout(timeout); };
  }, [store]);

  if (loading) return <div className="min-h-screen bg-[#FFF5E1] flex items-center justify-center font-black uppercase text-xl animate-pulse">Loading...</div>;

  // If on admin page, render directly without the owner sidebar
  if (pathname.startsWith('/shop-manage/admin')) return <Outlet />;

  if (!store) return null;

  return (
    <div className="min-h-screen bg-[#FFF5E1] flex">
      <aside className="hidden md:flex w-64 bg-white border-r-4 border-black flex-col h-screen sticky top-0 z-40">
        <div className="p-4 border-b-4 border-black bg-yellow-300">
          <h1 className="text-2xl font-black uppercase tracking-tighter truncate flex items-center gap-2">
            <Store strokeWidth={3} /> {store?.name || 'Shop Manager'}
          </h1>
          <p className="font-bold text-sm mt-1">{store?.role === 'owner' ? 'Owner' : 'Manager'} • {store?.campus.join(', ')}</p>
          <div className={`mt-2 font-black uppercase text-[10px] tracking-widest inline-block px-2 py-0.5 border-2 border-black ${store?.is_open ? 'bg-emerald-300' : 'bg-red-400 text-white'}`}>
            {store?.is_open ? 'Store Open' : 'Store Closed'}
          </div>
        </div>
        
        {/* Helper component for sidebar links */}
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <Link to="/shop-manage/products" className={`flex items-center justify-between p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/products') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <span className="flex items-center gap-3"><ShoppingBag strokeWidth={3} /> Products</span>
          </Link>
          <Link to="/shop-manage/active" className={`flex items-center justify-between p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/active') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <span className="flex items-center gap-3"><Activity strokeWidth={3} /> Active</span>
            {store?.stats?.active > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{store.stats.active}</span>}
          </Link>
          <Link to="/shop-manage/orders" className={`flex items-center justify-between p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/orders') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <span className="flex items-center gap-3"><ListOrdered strokeWidth={3} /> Orders</span>
            {store?.stats?.placed > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{store.stats.placed}</span>}
          </Link>
          <Link to="/shop-manage/deliver" className={`flex items-center justify-between p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/deliver') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <span className="flex items-center gap-3"><Truck strokeWidth={3} /> To Deliver</span>
            {store?.stats?.deliver > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{store.stats.deliver}</span>}
          </Link>
          <Link to="/shop-manage/settings" className={`flex items-center p-3 font-black uppercase border-4 border-black transition-all ${pathname.includes('/settings') ? 'bg-black text-white' : 'bg-white hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'}`}>
            <span className="flex items-center gap-3"><Settings strokeWidth={3} /> Settings</span>
          </Link>
        </nav>
        <div className="p-4 mt-auto border-t-4 border-black">
          <Link to="/shop" className="flex items-center justify-center gap-2 w-full p-3 bg-red-500 text-white border-4 border-black font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">
            <LogOut size={18} strokeWidth={3} /> Exit
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0 h-screen overflow-auto">
        <div className="md:hidden p-4 border-b-4 border-black bg-yellow-300 flex justify-between items-center sticky top-0 z-30">
          <h1 className="text-xl font-black uppercase tracking-tighter truncate flex items-center gap-2">
            <Store strokeWidth={3} size={20} /> {store?.name || 'Shop Manager'}
          </h1>
          <Link to="/shop" className="text-red-600 font-black px-2 hover:scale-110">
            <LogOut size={24} strokeWidth={3} />
          </Link>
        </div>
        <Outlet context={{ store, refreshStore }} />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-2 px-1 shadow-[0_-4px_0_0_#000]">
        <Link to="/shop-manage/products" className={`flex flex-col items-center gap-1 flex-1 ${pathname.includes('/products') ? 'text-[#3B82F6]' : 'text-black'}`}>
          <ShoppingBag size={22} strokeWidth={3} />
          <span className="text-[8px] font-black uppercase tracking-widest">Products</span>
        </Link>
        <Link to="/shop-manage/active" className={`flex flex-col items-center gap-1 flex-1 ${pathname.includes('/active') ? 'text-[#3B82F6]' : 'text-black'}`}>
          <div className="relative">
            <Activity size={22} strokeWidth={3} />
            {store?.stats?.active > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{store.stats.active}</span>}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Active</span>
        </Link>
        <Link to="/shop-manage/orders" className={`flex flex-col items-center gap-1 flex-1 ${pathname.includes('/orders') ? 'text-[#3B82F6]' : 'text-black'}`}>
          <div className="relative">
            <ListOrdered size={22} strokeWidth={3} />
            {store?.stats?.placed > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{store.stats.placed}</span>}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Orders</span>
        </Link>
        <Link to="/shop-manage/deliver" className={`flex flex-col items-center gap-1 flex-1 ${pathname.includes('/deliver') ? 'text-[#3B82F6]' : 'text-black'}`}>
          <div className="relative">
            <Truck size={22} strokeWidth={3} />
            {store?.stats?.deliver > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{store.stats.deliver}</span>}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Deliver</span>
        </Link>
        <Link to="/shop-manage/settings" className={`flex flex-col items-center gap-1 flex-1 ${pathname.includes('/settings') ? 'text-[#3B82F6]' : 'text-black'}`}>
          <Settings size={22} strokeWidth={3} />
          <span className="text-[8px] font-black uppercase tracking-widest">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
