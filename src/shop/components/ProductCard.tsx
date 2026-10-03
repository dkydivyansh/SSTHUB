import { Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { discountPct, effectivePrice } from '../data/mock';
import { useShop } from '../context/ShopContext';

export function QtyStepper({ sku, max, size = 'md' }: { sku: string; max: number; size?: 'sm' | 'md' }) {
  const { cart, add, remove } = useShop();
  const qty = cart[sku] || 0;
  const pad = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-6 py-2';

  if (max <= 0) {
    return <div className={`${pad} border-4 border-black bg-gray-200 font-black uppercase text-xs text-center`}>Sold out</div>;
  }
  if (qty === 0) {
    return (
      <button
        onClick={e => { e.preventDefault(); add(sku); }}
        className={`${pad} w-full border-4 border-black bg-white font-black uppercase tracking-widest text-[#3B82F6] shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all`}
      >
        Add
      </button>
    );
  }
  return (
    <div className="flex w-full items-stretch border-4 border-black bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]">
      <button aria-label="Decrease" onClick={e => { e.preventDefault(); remove(sku); }} className="px-2 flex-1 flex items-center justify-center hover:bg-blue-700"><Minus size={16} strokeWidth={4} /></button>
      <span className="px-3 font-black flex items-center bg-white text-black border-x-4 border-black min-w-10 justify-center">{qty}</span>
      <button aria-label="Increase" disabled={qty >= max} onClick={e => { e.preventDefault(); add(sku); }} className="px-2 flex-1 flex items-center justify-center hover:bg-blue-700 disabled:opacity-40"><Plus size={16} strokeWidth={4} /></button>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const pct = discountPct(product);
  return (
    <div className="group bg-white border-4 border-black p-3 flex flex-col gap-2 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all">
      <Link to={`/shop/product/${product.sku}`} className="flex flex-col gap-2 flex-1">
        <div className="relative border-4 border-black aspect-square overflow-hidden bg-[#FFF5E1]">
          <img src={product.featured_image} alt={product.title} loading="lazy" className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${product.quantity <= 0 ? 'grayscale opacity-60' : ''}`} />
          {pct > 0 && (
            <span className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-black px-2 py-1 border-r-4 border-b-4 border-black uppercase">{pct}% off</span>
          )}
          {product.quantity <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-red-600 px-2 py-1 border-4 border-black font-black uppercase text-xs rotate-[-12deg]">Sold Out</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-lg">₹{effectivePrice(product)}</span>
          {pct > 0 && <span className="text-xs line-through text-gray-500 font-bold">₹{product.price}</span>}
        </div>
        <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.title}</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 border-2 border-gray-200 px-1">{product.unit}</p>
          {product.quantity > 0 && product.quantity <= 5 && <p className="text-[10px] font-black uppercase text-orange-600 bg-orange-100 border-2 border-orange-200 px-1">Only {product.quantity} left</p>}
        </div>
      </Link>
      <QtyStepper sku={product.sku} max={product.quantity} size="sm" />
    </div>
  );
}
