import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { effectivePrice, getProduct } from '../data/mock';
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, useShop } from '../context/ShopContext';
import { QtyStepper } from '../components/ProductCard';
import { SectionTitle } from './ShopHome';
import type { Order, OrderStatus } from '../types';

export function CartPage() {
  const { cart, count, subtotal, deliveryFee, total, clear, campus, placeOrder } = useShop();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'COD' | 'UPI'>('COD');
  const [error, setError] = useState('');

  const items = Object.entries(cart).map(([sku, qty]) => ({ p: getProduct(sku)!, qty })).filter(i => i.p);
  const blocked = items.filter(i => campus && !i.p.available_to.includes(campus));

  if (count === 0) {
    return (
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-10 text-center max-w-lg mx-auto mt-8">
        <div className="text-7xl mb-2">🛒</div>
        <h1 className="text-2xl font-black uppercase">Your cart is empty</h1>
        <Link to="/shop" className="inline-block mt-4 bg-[#3B82F6] text-white border-4 border-black px-6 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-all">Start shopping</Link>
      </div>
    );
  }

  const submit = () => {
    if (address.trim().length < 5) return setError('Enter your hostel / room / landmark.');
    if (blocked.length) return setError('Remove items unavailable on your campus.');
    placeOrder(address.trim(), payment);
    navigate('/shop/orders');
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Cart ({count})</SectionTitle>
          <button onClick={clear} className="flex items-center gap-1 font-black uppercase text-xs text-red-600 hover:underline"><Trash2 size={14} /> Clear</button>
        </div>
        <div className="flex flex-col gap-4">
          {items.map(({ p, qty }) => (
            <div key={p.sku} className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-3 flex gap-3 items-center">
              <Link to={`/shop/product/${p.sku}`}><img src={p.featured_image} alt="" className="w-20 h-20 border-4 border-black object-cover" /></Link>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-tight truncate">{p.title}</h3>
                <p className="text-xs font-bold uppercase text-gray-500">{p.unit}</p>
                {campus && !p.available_to.includes(campus) && <p className="text-xs font-black text-red-600 uppercase">Unavailable on your campus</p>}
                <p className="font-black mt-1">₹{effectivePrice(p) * qty}</p>
              </div>
              <div className="w-28"><QtyStepper sku={p.sku} max={p.quantity} size="sm" /></div>
            </div>
          ))}
        </div>
      </div>

      <aside className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-5 flex flex-col gap-4 lg:sticky lg:top-24">
        <h2 className="text-xl font-black uppercase">Checkout</h2>
        <div className="text-sm font-bold flex flex-col gap-1">
          <div className="flex justify-between"><span>Items</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
          {deliveryFee > 0 && <p className="text-xs text-[#3B82F6]">Add ₹{FREE_DELIVERY_ABOVE - subtotal} more for free delivery (fee ₹{DELIVERY_FEE})</p>}
          <div className="flex justify-between text-lg font-black border-t-4 border-black pt-2 mt-1"><span>Total</span><span>₹{total}</span></div>
        </div>
        <label className="font-black uppercase text-xs">Delivery address
          <textarea value={address} onChange={e => { setAddress(e.target.value); setError(''); }} rows={2} placeholder="Hostel, room no., landmark" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['COD', 'UPI'] as const).map(m => (
            <button key={m} onClick={() => setPayment(m)} className={`border-4 border-black p-2 font-black uppercase text-sm ${payment === m ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white'}`}>{m === 'COD' ? 'Cash' : 'UPI'}</button>
          ))}
        </div>
        {error && <p className="text-red-600 font-black text-xs uppercase">{error}</p>}
        <button onClick={submit} className="bg-emerald-400 border-4 border-black py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">Place order · ₹{total}</button>
      </aside>
    </div>
  );
}

const STEPS: OrderStatus[] = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered'];
const LABEL: Record<OrderStatus, string> = { placed: 'Placed', accepted: 'Accepted', packed: 'Packed', out_for_delivery: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled' };

function OrderCard({ o }: { o: Order }) {
  const idx = STEPS.indexOf(o.status);
  return (
    <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-4 flex flex-col gap-3">
      <div className="flex justify-between flex-wrap gap-2">
        <div><p className="font-black uppercase">{o.store_name}</p><p className="text-xs font-bold text-gray-500">#{o.id} · {new Date(o.placed_at).toLocaleString()}</p></div>
        <span className={`self-start border-4 border-black px-2 py-1 text-xs font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-300' : o.status === 'cancelled' ? 'bg-red-300' : 'bg-yellow-300'}`}>{LABEL[o.status]}</span>
      </div>
      {o.status !== 'cancelled' && (
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center relative">
              <div className={`w-4 h-4 border-4 border-black z-10 ${i <= idx ? 'bg-[#3B82F6]' : 'bg-white'}`} />
              {i < STEPS.length - 1 && <div className={`absolute top-1.5 left-1/2 w-full h-1 ${i < idx ? 'bg-[#3B82F6]' : 'bg-gray-300'}`} />}
              <span className="text-[8px] sm:text-[10px] font-black uppercase mt-1 text-center">{LABEL[s]}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto">{o.lines.map(l => <div key={l.sku} className="shrink-0 relative"><img src={l.image} alt={l.title} title={l.title} className="w-14 h-14 border-4 border-black object-cover" /><span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-1">×{l.qty}</span></div>)}</div>
      <div className="flex justify-between font-black text-sm border-t-4 border-black pt-2"><span>{o.payment_method} · {o.address}</span><span>₹{o.total}</span></div>
    </div>
  );
}

export function OrdersPage() {
  const { orders } = useShop();
  return (
    <div>
      <SectionTitle>Your orders</SectionTitle>
      {orders.length === 0
        ? <div className="bg-white border-4 border-black p-10 text-center font-black uppercase shadow-[4px_4px_0_0_#000]">No orders yet 📦</div>
        : <div className="flex flex-col gap-5 max-w-3xl">{orders.map(o => <OrderCard key={o.id} o={o} />)}</div>}
    </div>
  );
}
