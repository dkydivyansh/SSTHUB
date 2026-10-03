import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { effectivePrice } from '../data/mock';
import { useCatalog } from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';
import { SectionTitle, StoreCard } from './ShopHome';

type Sort = 'relevance' | 'price_asc' | 'price_desc' | 'discount';
const sortFn = (s: Sort) => (a: any, b: any) =>
  s === 'price_asc' ? effectivePrice(a) - effectivePrice(b)
  : s === 'price_desc' ? effectivePrice(b) - effectivePrice(a)
  : s === 'discount' ? (b.price - effectivePrice(b)) / b.price - (a.price - effectivePrice(a)) / a.price
  : 0;

function SortBar({ sort, setSort, count }: { sort: Sort; setSort: (s: Sort) => void; count: number }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <span className="font-black uppercase text-sm">{count} items</span>
      <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="border-4 border-black bg-white font-black uppercase text-xs p-2 shadow-[3px_3px_0_0_#000]">
        <option value="relevance">Relevance</option>
        <option value="price_asc">Price: Low → High</option>
        <option value="price_desc">Price: High → Low</option>
        <option value="discount">Best discount</option>
      </select>
    </div>
  );
}

const Empty = ({ text }: { text: string }) => (
  <div className="bg-white border-4 border-black p-10 text-center shadow-[4px_4px_0_0_#000]">
    <div className="text-6xl mb-2">🫥</div><p className="font-black uppercase">{text}</p>
  </div>
);

const Back = () => <Link to="/shop" className="inline-flex items-center gap-1 font-black uppercase text-sm mb-4 hover:underline"><ArrowLeft size={16} /> Shop</Link>;

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products } = useCatalog();
  const cat = categories.find(x => x.slug === (slug || ''));
  const [sort, setSort] = useState<Sort>('relevance');
  if (!cat) return <Empty text="Category not found" />;
  
  const activeCategories = categories.filter(c => products.some(p => p.categories.includes(c.id)));
  const list = products.filter(p => p.categories.includes(cat.id)).sort(sortFn(sort));

  return (
    <div>
      <Back />
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {activeCategories.map(c => (
          <Link key={c.id} to={`/shop/category/${c.slug}`} className={`shrink-0 border-4 border-black px-3 py-1 font-black uppercase text-xs ${c.id === cat.id ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white'}`}>{c.name}</Link>
        ))}
      </div>
      <SectionTitle>{cat.name}</SectionTitle>
      <p className="font-bold text-gray-600 mb-4">{cat.description}</p>
      <SortBar sort={sort} setSort={setSort} count={list.length} />
      {list.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{list.map(p => <ProductCard key={p.sku} product={p} />)}</div> : <Empty text="Nothing here for your campus yet" />}
    </div>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const { products, stores, categories } = useCatalog();
  const [sort, setSort] = useState<Sort>('relevance');
  
  const qTerms = q.split(/\s+/).filter(Boolean);
  
  const matchedStores = stores.filter(s => {
    const text = (s.name + ' ' + s.description).toLowerCase();
    return qTerms.every(term => text.includes(term));
  });
  
  const list = products.filter(p => {
    const catNames = p.categories.map(cId => categories.find(c => c.id === cId)?.name || '').join(' ');
    const storeName = stores.find(s => s.id === p.store_id)?.name || '';
    const text = (p.title + ' ' + p.description + ' ' + Object.values(p.info).join(' ') + ' ' + catNames + ' ' + storeName).toLowerCase();
    return qTerms.length === 0 || qTerms.every(term => text.includes(term));
  }).sort(sortFn(sort));
  
  return (
    <div>
      <Back />
      <SectionTitle>Results for “{params.get('q')}”</SectionTitle>
      
      <SortBar sort={sort} setSort={setSort} count={list.length} />
      {list.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">{list.map(p => <ProductCard key={p.sku} product={p} />)}</div> : (matchedStores.length === 0 && <Empty text="No matches found" />)}

      {matchedStores.length > 0 && (
        <div className="mb-8">
          <SectionTitle>Stores</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedStores.map(s => <StoreCard key={s.id} store={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function StoresPage() {
  const { stores } = useCatalog();
  return (
    <div>
      <Back />
      <SectionTitle>All stores</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">{stores.map(s => <StoreCard key={s.id} store={s} />)}</div>
      {!stores.length && <Empty text="No stores for your campus" />}
    </div>
  );
}

export function StorePage() {
  const { id } = useParams();
  const { stores, products, categories } = useCatalog();
  const store = stores.find(x => x.id === Number(id));
  const [cat, setCat] = useState<number | null>(null);
  if (!store) return <Empty text="Store not found" />;
  const all = products.filter(p => p.store_id === store.id);
  const featured = (store.featured || []).map((s: string) => all.find(p => p.sku === s)).filter(Boolean);
  const list = all.filter(p => cat === null || p.categories.includes(cat));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <div className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white overflow-hidden">
          <img src={store.banner} alt="" className="w-full h-32 sm:h-44 object-cover border-b-4 border-black" />
          <div className="p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase leading-none mb-1">{store.name}</h1>
            <p className="font-bold text-sm text-gray-600">{store.description}</p>
            <p className="text-xs font-black uppercase mt-1">{store.is_open ? '🟢 Open' : '🔴 Closed'}</p>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <section>
          <SectionTitle>Featured</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-3 pr-2">{featured.map(p => <div key={p!.sku} className="w-40 shrink-0"><ProductCard product={p!} /></div>)}</div>
        </section>
      )}

      <section>
        <SectionTitle>Menu</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
          <button onClick={() => setCat(null)} className={`shrink-0 border-4 border-black px-3 py-1 font-black uppercase text-xs ${cat === null ? 'bg-[#3B82F6] text-white' : 'bg-white'}`}>All</button>
          {store.categories.map(cid => {
            const c = categories.find(x => x.id === cid)!;
            return <button key={cid} onClick={() => setCat(cid)} className={`shrink-0 border-4 border-black px-3 py-1 font-black uppercase text-xs ${cat === cid ? 'bg-[#3B82F6] text-white' : 'bg-white'}`}>{c?.name}</button>;
          })}
        </div>
        {list.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{list.map(p => <ProductCard key={p.sku} product={p} />)}</div> : <Empty text="No items" />}
      </section>
    </div>
  );
}
