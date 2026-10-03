import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, LayoutGrid, MapPin, Package, Search, ShoppingCart, Store as StoreIcon, X } from 'lucide-react';
import { CAMPUSES } from '../types';
import { useShop } from '../context/ShopContext';

/** Session is the only thing shared with the main app: same /api/profile cookie session. */
function useSession() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.data) {
          if (d.data.status === 'disabled') return navigate('/login?error=' + encodeURIComponent('Your account has been disabled.'));
          if (d.data.status === 'pending') return navigate('/onboarding');
          setUser(d.data);
        } else navigate('/login');
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  return { user, loading };
}

function CampusModal({ onClose }: { onClose?: () => void }) {
  const { campus, setCampus } = useShop();
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#FFF5E1] border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black uppercase">Deliver to?</h2>
            <p className="text-sm font-bold text-gray-600">Pick your campus to see what's available.</p>
          </div>
          {onClose && campus && <button onClick={onClose} aria-label="Close"><X size={28} strokeWidth={3} /></button>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CAMPUSES.map(c => (
            <button
              key={c.id}
              onClick={() => { setCampus(c.id); onClose?.(); }}
              className={`p-4 border-4 border-black font-black uppercase tracking-wide transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] ${campus === c.id ? 'bg-[#3B82F6] text-white' : 'bg-white'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopLayout() {
  const { user, loading } = useSession();
  const { campus, count, subtotal } = useShop();
  const location = useLocation();
  const navigate = useNavigate();
  const [campusOpen, setCampusOpen] = useState(false);
  const [mobSearchOpen, setMobSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FFF5E1]"><div className="text-2xl font-black uppercase tracking-widest animate-pulse">Loading Shop...</div></div>;
  }
  if (!user) return null;

  const campusLabel = CAMPUSES.find(c => c.id === campus)?.label;
  const active = (p: string) => (p === '/shop' ? location.pathname === '/shop'
    : p === '/shop/categories' ? /^\/shop\/categor(y|ies)/.test(location.pathname)
    : location.pathname.startsWith(p));
  const onCart = location.pathname.startsWith('/shop/cart');

  const sideItem = (to: string, Icon: any, label: string, badge = 0) => (
    <Link key={to} to={to} className={`flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : 'justify-start'} ${active(to) ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0_0_#000] translate-x-1 translate-y-1' : 'bg-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000]'}`}>
      <div className="relative">
        <Icon size={24} className="shrink-0" />
        {badge > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{badge > 99 ? '99+' : badge}</div>}
      </div>
      <span className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>{label}</span>
    </Link>
  );

  const mobItem = (to: string, Icon: any, label: string, badge = 0) => (
    <Link key={to} to={to} className={`flex flex-col items-center justify-center p-2 flex-1 transition-colors ${active(to) ? 'text-[#3B82F6]' : 'text-black'}`}>
      <div className="relative flex flex-col items-center">
        <Icon size={20} strokeWidth={active(to) ? 3 : 2} />
        {badge > 0 && <div className="absolute -top-1 -right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{badge}</div>}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">{label}</span>
    </Link>
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#FFF5E1] flex font-sans text-black">
      {(!campus || campusOpen) && <CampusModal onClose={() => setCampusOpen(false)} />}

      {/* Desktop sidebar (same look as main app) */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`hidden lg:flex flex-col bg-[#FFF5E1] border-r-4 border-black h-screen p-8 sticky top-0 transition-all duration-300 z-40 ${collapsed ? 'w-28 items-center px-4' : 'w-80'}`}
      >
        <div className={`mb-12 flex flex-col ${collapsed ? 'items-center' : ''}`}>
          <div className={`font-black tracking-tight uppercase flex items-center bg-white border-4 border-black shadow-[4px_4px_0_0_#000] -rotate-2 transition-all duration-300 ${collapsed ? 'text-xl px-2 py-1' : 'text-3xl px-3 py-1'}`}>
            SST
            <div className={`overflow-hidden transition-all duration-300 flex items-center ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100 ml-1'}`}>
              <span className="text-white px-2 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Shop</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full">
          {sideItem('/shop', Home, 'Home')}
          {sideItem('/shop/categories', LayoutGrid, 'Category')}
          {sideItem('/shop/stores', StoreIcon, 'Stores')}
          {sideItem('/shop/cart', ShoppingCart, 'Cart', count)}
          {sideItem('/shop/orders', Package, 'Orders')}
          <div className="mt-auto">{sideItem('/dash', ArrowLeft, 'Back to Hub')}</div>
        </nav>
      </aside>

      <main id="shop-main" className="flex-1 min-w-0 flex flex-col pb-32 lg:pb-0">
        {/* Top bar: campus + search (Desktop Only) */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[#FFF5E1] border-b-4 border-black px-8 py-3 items-center gap-3">
          <button onClick={() => setCampusOpen(true)} className="flex items-center gap-2 bg-white border-4 border-black px-3 py-2 font-black uppercase text-xs shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all shrink-0">
            <MapPin size={16} className="text-red-500" /> {campusLabel || 'Select'}
          </button>

          <form onSubmit={submitSearch} className="flex-1 items-stretch border-4 border-black bg-white shadow-[3px_3px_0_0_#000] flex">
            <div className="px-3 flex items-center"><Search size={18} /></div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products & stores..." className="flex-1 min-w-0 py-2 font-bold outline-none bg-transparent" />
            <button type="submit" className="bg-[#3B82F6] text-white font-black uppercase tracking-widest text-xs px-4 border-l-4 border-black hover:bg-blue-600 transition-colors">Search</button>
          </form>

          <Link to="/shop/cart" className="flex items-center gap-2 bg-[#3B82F6] text-white border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all shrink-0">
            <ShoppingCart size={18} /> {count > 0 ? `₹${subtotal}` : 'Cart'}
          </Link>
        </header>

        <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-1">
          <Outlet />
        </div>
      </main>

      {/* Floating cart bar (mobile) */}
      {count > 0 && !onCart && (
        <Link to="/shop/cart" className="lg:hidden fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between bg-[#3B82F6] text-white border-4 border-black px-4 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
          <span className="flex items-center gap-2"><ShoppingCart size={20} /> {count} item{count > 1 ? 's' : ''}</span>
          <span>View cart · ₹{subtotal}</span>
        </Link>
      )}

      {/* Mobile bottom nav */}
      <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-1 px-2 shadow-[0_-4px_0_0_#000]">
        {mobItem('/shop', Home, 'Home')}
        {mobItem('/shop/categories', LayoutGrid, 'Category')}
        {mobItem('/shop/stores', StoreIcon, 'Stores')}
        {mobItem('/shop/cart', ShoppingCart, 'Cart', count)}
        {mobItem('/shop/orders', Package, 'Orders')}
      </nav>
    </div>
  );
}
