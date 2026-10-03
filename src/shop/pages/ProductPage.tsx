import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { discountPct, effectivePrice } from '../data/mock';
import { CAMPUSES } from '../types';
import { storeDeliveryFee, useShop } from '../context/ShopContext';
import { QtyStepper } from '../components/ProductCard';
import ProductCard from '../components/ProductCard';
import { SectionTitle } from './ShopHome';

export default function ProductPage() {
  const { sku } = useParams();
  const { campus, products, stores, categories } = useShop();
  const p = products.find(x => x.sku === sku);
  const [img, setImg] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  if (!p) return <div className="bg-white border-4 border-black p-10 text-center font-black uppercase">Product not found</div>;

  const store = stores.find(x => x.id === p.store_id)!;
  const pct = discountPct(p);
  const images = [p.featured_image, ...(Array.isArray(p.gallery) ? p.gallery : [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);
  const deliverable = !campus || p.available_to.includes(campus);
  const isClosed = !store.is_open || !store.is_active;
  const related = products.filter(x => x.sku !== p.sku && x.categories.some(c => p.categories.includes(c)) && (!campus || x.available_to.includes(campus))).slice(0, 5);
  const dInfo = campus ? storeDeliveryFee(store, campus, 0) : null;
  const deliveryText = !dInfo || dInfo.feeBase <= 0 ? 'FREE'
    : dInfo.freeAbove > 0 ? `₹${dInfo.feeBase} (free above ₹${dInfo.freeAbove})` : `₹${dInfo.feeBase}`;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link to="/shop" className="inline-flex items-center gap-1 font-black uppercase text-sm mb-4 hover:underline"><ArrowLeft size={16} /> Shop</Link>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="min-w-0">
            <div className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white aspect-square overflow-hidden">
              <img src={images[img]} alt={p.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {images.map((g, i) => <button key={i} onClick={() => setImg(i)} className={`w-16 h-16 shrink-0 border-4 border-black ${i === img ? 'shadow-[3px_3px_0_0_#3B82F6]' : 'opacity-70'}`}><img src={g} alt="" className="w-full h-full object-cover" /></button>)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <Link to={`/shop/store/${store.id}`} className="self-start bg-white border-4 border-black px-2 py-1 text-xs font-black uppercase hover:bg-[#3B82F6] hover:text-white">{store.name}</Link>
            <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight break-words">{p.title}</h1>
            <p className="font-bold uppercase text-gray-500">{p.unit} · SKU {p.sku}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black">₹{effectivePrice(p)}</span>
              {pct > 0 && <><span className="line-through text-gray-500 font-bold text-lg">₹{p.price}</span><span className="bg-red-500 text-white border-4 border-black px-2 font-black text-sm">{pct}% OFF</span></>}
            </div>
            <div>
              <p className={`font-medium whitespace-pre-wrap ${!descExpanded && p.description.length > 150 ? 'line-clamp-3' : ''}`}>{p.description}</p>
              {p.description.length > 150 && (
                <button onClick={() => setDescExpanded(!descExpanded)} className="text-[#3B82F6] font-black uppercase text-xs hover:underline mt-1">
                  {descExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            {p.quantity > 0 && p.quantity <= 10 && <p className="text-red-600 font-black uppercase text-sm">Only {p.quantity} left!</p>}
            {!deliverable && <p className="bg-yellow-200 border-4 border-black p-2 font-black uppercase text-xs">Not available on your campus. Available at: {p.available_to.map(c => CAMPUSES.find(x => x.id === c)?.label).join(', ')}</p>}
            {isClosed && <p className="bg-red-200 border-4 border-black p-2 font-black uppercase text-xs">Store is currently closed.</p>}

            <div className="max-w-xs">
              {deliverable && !isClosed ? <QtyStepper sku={p.sku} max={p.quantity} /> : <div className="p-3 border-4 border-black bg-gray-200 text-center font-black uppercase text-sm">Unavailable</div>}
            </div>

            <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000]">
              <h2 className="font-black uppercase px-4 py-2 border-b-4 border-black bg-[#FFF5E1]">Product info</h2>
              <dl className="divide-y-2 divide-black">
                {Object.entries(p.info).map(([k, v]) => (
                  <div key={k} className="flex flex-col sm:flex-row sm:justify-between px-4 py-3 sm:py-2 text-sm gap-1 sm:gap-4"><dt className="font-black uppercase shrink-0">{k.replace(/_/g, ' ')}</dt><dd className="font-bold sm:text-right break-words min-w-0">{v as string}</dd></div>
                ))}
                <div className="flex flex-col sm:flex-row sm:justify-between px-4 py-3 sm:py-2 text-sm gap-1 sm:gap-4"><dt className="font-black uppercase shrink-0">Category</dt><dd className="font-bold sm:text-right break-words min-w-0">{p.categories.map(c => categories.find(x => x.id == c)?.name).filter(Boolean).join(', ')}</dd></div>
                <div className="flex flex-col sm:flex-row sm:justify-between px-4 py-3 sm:py-2 text-sm gap-1 sm:gap-4"><dt className="font-black uppercase shrink-0">Delivery</dt><dd className="font-bold sm:text-right break-words min-w-0">{deliveryText}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <SectionTitle>You may also like</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{related.map(r => <ProductCard key={r.sku} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
