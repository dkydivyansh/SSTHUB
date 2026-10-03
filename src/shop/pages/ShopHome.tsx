import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useMemo } from 'react';
import { CATEGORIES, discountPct } from '../data/mock';
import { useCatalog } from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';
import type { Product, Store } from '../types';

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link to={`/shop/store/${store.id}`} className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all flex flex-col">
      <div className="h-24 border-b-4 border-black overflow-hidden"><img src={store.banner} alt="" className="w-full h-full object-cover" /></div>
      <div className="p-3 flex gap-3 items-center">
        <img src={store.logo} alt="" className="w-12 h-12 border-4 border-black -mt-8 bg-white" />
        <div className="min-w-0">
          <h3 className="font-black uppercase leading-tight truncate">{store.name}</h3>
          <p className="text-xs font-bold flex items-center gap-1 text-gray-600"><Clock size={12} />{store.opens_at}–{store.closes_at}
            <span className={`ml-1 px-1 border-2 border-black text-[10px] ${store.is_open ? 'bg-emerald-300' : 'bg-red-300'}`}>{store.is_open ? 'OPEN' : 'CLOSED'}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export const SectionTitle = ({ children, to }: { children: React.ReactNode; to?: string }) => (
  <div className="flex items-end justify-between mb-4">
    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-white inline-block border-4 border-black px-3 py-1 shadow-[4px_4px_0_0_#000] -rotate-1">{children}</h2>
    {to && <Link to={to} className="font-black uppercase text-sm underline decoration-4 decoration-[#3B82F6]">See all</Link>}
  </div>
);

/** Horizontal scroller for product rows */
function ProductRow({ items }: { items: Product[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
      {items.map(p => <div key={p.sku} className="w-44 sm:w-52 shrink-0 snap-start"><ProductCard product={p} /></div>)}
    </div>
  );
}

export function CategoriesPage() {
  return (
    <div>
      <SectionTitle>All categories</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {CATEGORIES.map(c => (
          <Link key={c.id} to={`/shop/category/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
            <img src={c.image} alt={c.name} className="w-full aspect-square border-4 border-black shadow-[3px_3px_0_0_#000] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_0_#000] transition-all object-cover" />
            <span className="text-xs font-black uppercase leading-tight">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ShopHome() {
  const { stores, products } = useCatalog();
  const deals = useMemo(() => products.filter(p => p.discounted_price).sort((a, b) => (a.discounted_price! / a.price) - (b.discounted_price! / b.price)).slice(0, 10), [products]);
  const featured = stores.flatMap(s => s.featured).map(sku => products.find(p => p.sku === sku)).filter(Boolean) as Product[];
  // Random picks: shuffled once per mount
  const random = useMemo(() => [...products].sort(() => Math.random() - 0.5).slice(0, 10), [products]);
  const bigOffers = useMemo(() => products.filter(p => discountPct(p) >= 20).slice(0, 4), [products]);
  const under50 = useMemo(() => products.filter(p => (p.discounted_price ?? p.price) <= 50).slice(0, 10), [products]);
  const catSections = useMemo(() => CATEGORIES.map(c => ({ c, items: products.filter(p => p.categories.includes(c.id)).slice(0, 10) })).filter(s => s.items.length > 0).slice(0, 4), [products]);

  return (
    <div className="flex flex-col gap-10">
      <section className="bg-[#3B82F6] text-white border-4 border-black shadow-[8px_8px_0_0_#000] p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 text-[8rem] sm:text-[12rem] opacity-30 select-none rotate-12">🛒</div>
        <p className="font-black uppercase text-xs tracking-widest bg-black inline-block px-2 py-1 mb-3">SST Shop</p>
        <h1 className="text-4xl sm:text-6xl font-black uppercase leading-none">Campus delivery,<br />in minutes.</h1>
        <p className="font-bold mt-3 max-w-md">Snacks, groceries & stationery straight to your hostel. Free delivery over ₹199.</p>
      </section>

      <section>
        <SectionTitle>Categories</SectionTitle>
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/shop/category/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
              <img src={c.image} alt={c.name} className="w-full aspect-square border-4 border-black shadow-[3px_3px_0_0_#000] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_0_#000] transition-all object-cover" />
              <span className="text-[11px] sm:text-xs font-black uppercase leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {random.length > 0 && (
        <section><SectionTitle>Random picks 🎲</SectionTitle><ProductRow items={random} /></section>
      )}

      {bigOffers.length > 0 && (
        <section>
          <SectionTitle>Mega offers 💥</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bigOffers.map(p => (
              <Link key={p.sku} to={`/shop/product/${p.sku}`} className="flex items-center gap-4 bg-yellow-300 border-4 border-black shadow-[4px_4px_0_0_#000] p-3 hover:-translate-y-1 transition-all">
                <img src={p.featured_image} alt="" className="w-20 h-20 border-4 border-black bg-white object-cover" />
                <div className="min-w-0">
                  <p className="font-black text-3xl leading-none">{discountPct(p)}% OFF</p>
                  <p className="font-black uppercase truncate">{p.title}</p>
                  <p className="font-bold text-sm">₹{p.discounted_price} <span className="line-through opacity-60">₹{p.price}</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {deals.length > 0 && (
        <section><SectionTitle>Hot deals 🔥</SectionTitle><ProductRow items={deals} /></section>
      )}

      {under50.length > 0 && (
        <section><SectionTitle>Under ₹50 💸</SectionTitle><ProductRow items={under50} /></section>
      )}

      {catSections.map(({ c, items }) => (
        <section key={c.id}>
          <SectionTitle to={`/shop/category/${c.slug}`}>{c.name}</SectionTitle>
          <ProductRow items={items} />
        </section>
      ))}

      <section>
        <SectionTitle to="/shop/stores">Stores near you</SectionTitle>
        {stores.length === 0
          ? <p className="font-bold">No stores deliver to your campus yet.</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">{stores.map(s => <StoreCard key={s.id} store={s} />)}</div>}
      </section>

      {featured.length > 0 && (
        <section><SectionTitle>Featured by stores ⭐</SectionTitle><ProductRow items={featured} /></section>
      )}
    </div>
  );
}
