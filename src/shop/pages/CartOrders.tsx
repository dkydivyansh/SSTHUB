import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Store } from 'lucide-react';
import { effectivePrice } from '../data/mock';
import { useShop } from '../context/ShopContext';
import { QtyStepper } from '../components/ProductCard';
import { SectionTitle } from './ShopHome';
import type { Order, OrderStatus } from '../types';
import { useCatalog } from '../hooks/useCatalog';

export function CartPage() {
  const { cart, count, subtotal, deliveryFee, total, clear, campus, placeOrder, storeCharges } = useShop();
  const { products, stores, catalogLoading } = useCatalog();
  const navigate = useNavigate();
  const [address, setAddress] = useState(() => localStorage.getItem('shop_address_v1') || '');
  const [otherAddress, setOtherAddress] = useState(() => localStorage.getItem('shop_other_address_v1') || '');
  const [mobile, setMobile] = useState(() => localStorage.getItem('shop_mobile_v1') || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (catalogLoading) return <div className="p-10 text-center font-black uppercase animate-pulse">Loading cart...</div>;

  const items = Object.entries(cart).map(([sku, qty]) => ({ p: products.find(x => x.sku === sku), qty })).filter(i => i.p);
  const blocked = items.filter(i => campus && !i.p!.available_to.includes(campus));

  if (count === 0) {
    return (
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-10 text-center max-w-lg mx-auto mt-8">
        <div className="text-7xl mb-2">🛒</div>
        <h1 className="text-2xl font-black uppercase">Your cart is empty</h1>
        <Link to="/shop" className="inline-block mt-4 bg-[#3B82F6] text-white border-4 border-black px-6 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-all">Start shopping</Link>
      </div>
    );
  }

  const submit = async () => {
    if (mobile.trim().length < 10) return setError('Enter a valid mobile number.');
    if (blocked.length) return setError('Remove items unavailable on your campus.');
    
    localStorage.setItem('shop_address_v1', address.trim());
    localStorage.setItem('shop_other_address_v1', otherAddress.trim());
    localStorage.setItem('shop_mobile_v1', mobile.trim());
    
    let finalAddress = '';
    if (campus === 'UNI1' || campus === 'UNI2') {
      const parts = [];
      if (address.trim()) parts.push(`Room No. ${address.trim()}`);
      if (otherAddress.trim()) parts.push(otherAddress.trim());
      finalAddress = parts.join(', ');
    } else {
      finalAddress = address.trim();
    }

    setPlacing(true);
    try {
      await placeOrder(finalAddress, mobile.trim(), note.trim(), 'COD');
      navigate('/shop/orders');
    } catch (e: any) {
      setError(e.message || 'Failed to place order');
      setPlacing(false);
    }
  };

  // Group by store for visual separation
  const byStore = new Map<number, typeof items>();
  items.forEach(item => {
    const list = byStore.get(item.p!.store_id) || [];
    list.push(item);
    byStore.set(item.p!.store_id, list);
  });

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Cart ({count})</SectionTitle>
          <button onClick={clear} className="flex items-center gap-1 font-black uppercase text-xs text-red-600 hover:underline"><Trash2 size={14} /> Clear</button>
        </div>
        <div className="flex flex-col gap-6">
          {Array.from(byStore.entries()).map(([storeId, storeItems]) => {
            const store = stores.find(s => s.id === storeId);
            return (
              <div key={storeId} className="flex flex-col gap-2">
                <h3 className="font-black uppercase flex items-center gap-2 bg-[#FFF5E1] p-2 border-4 border-black"><Store size={18} /> {store?.name || 'Store'}</h3>
                {storeItems.map(({ p, qty }) => {
                  const isAvailable = !campus || p!.available_to.includes(campus);
                  const isStoreClosed = store && (!store.is_open || !store.is_active);
                  const showFaded = !isAvailable || isStoreClosed;
                  return (
                  <div key={p!.sku} className={`bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-3 flex gap-3 items-center ${showFaded ? 'opacity-50 grayscale' : ''}`}>
                    <Link to={`/shop/product/${p!.sku}`}><img src={p!.featured_image} alt="" className="w-20 h-20 border-4 border-black object-cover" /></Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold leading-tight truncate">{p!.title}</h3>
                      <p className="text-xs font-bold uppercase text-gray-500">{p!.unit}</p>
                      {!isAvailable && <p className="text-xs font-black text-red-600 uppercase">Unavailable on your campus</p>}
                      {isStoreClosed && <p className="text-xs font-black text-red-600 uppercase">Store is closed</p>}
                      <p className="font-black mt-1">₹{effectivePrice(p as any) * qty}</p>
                    </div>
                    <div className="w-28"><QtyStepper sku={p!.sku} max={p!.quantity} size="sm" /></div>
                  </div>
                  );
                })}
                {(() => {
                  const ch = storeCharges.find(c => c.storeId === storeId);
                  if (!ch) return null;
                  return (
                    <div className="bg-white border-4 border-black p-2 text-xs font-black uppercase">
                      <div className="flex justify-between"><span>{store?.name} subtotal</span><span>₹{ch.subtotal}</span></div>
                      <div className="flex justify-between"><span>Delivery</span><span>{ch.fee === 0 ? 'FREE' : `₹${ch.fee}`}</span></div>
                      {ch.fee > 0 && ch.freeAbove > 0 && <p className="text-[#3B82F6] normal-case">Add ₹{Math.ceil(ch.freeAbove - ch.subtotal)} more from this store for free delivery</p>}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-5 flex flex-col gap-4 lg:sticky lg:top-24">
        <h2 className="text-xl font-black uppercase">Checkout</h2>
        <div className="text-sm font-bold flex flex-col gap-1">
          <div className="flex justify-between"><span>Items</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>Delivery{storeCharges.length > 1 ? ' (per store)' : ''}</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
          <div className="flex justify-between text-lg font-black border-t-4 border-black pt-2 mt-1"><span>Total</span><span>₹{total}</span></div>
        </div>
        {(campus === 'UNI1' || campus === 'UNI2') ? (
          <>
            <label className="font-black uppercase text-xs">Room No. (Optional)
              <input type="text" value={address} onChange={e => { setAddress(e.target.value); setError(''); }} placeholder="e.g. 101" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
            </label>
            <label className="font-black uppercase text-xs mt-3 block">Other Address (Optional)
              <textarea value={otherAddress} onChange={e => { setOtherAddress(e.target.value); setError(''); }} rows={1} placeholder="Specific location" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
            </label>
          </>
        ) : (
          <label className="font-black uppercase text-xs">Delivery address (Optional)
            <textarea value={address} onChange={e => { setAddress(e.target.value); setError(''); }} rows={2} placeholder="Hostel, room no., landmark" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
          </label>
        )}
        <label className="font-black uppercase text-xs mt-3 block">Mobile Number
          <input type="tel" value={mobile} onChange={e => { setMobile(e.target.value); setError(''); }} placeholder="10-digit mobile" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
        </label>
        <label className="font-black uppercase text-xs mt-3 block">Note (optional)
          <input type="text" value={note} onChange={e => { setNote(e.target.value); setError(''); }} placeholder="Instructions for store/delivery" className="mt-1 w-full border-4 border-black p-2 font-bold normal-case outline-none focus:bg-yellow-100" />
        </label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <button className="border-4 border-black p-2 font-black uppercase text-sm bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000] cursor-default">Pay on Delivery (Cash)</button>
        </div>
        {error && <p className="text-red-600 font-black text-xs uppercase">{error}</p>}
        <button disabled={placing} onClick={submit} className="bg-emerald-400 border-4 border-black py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50">{placing ? 'Processing...' : `Place order · ₹${total}`}</button>
      </aside>
    </div>
  );
}

const STEPS: OrderStatus[] = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered'];
const LABEL: Record<OrderStatus, string> = { placed: 'Placed', accepted: 'Processing', packed: 'Packed', out_for_delivery: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled', rejected: 'Declined' };

function OrderCard({ o }: { o: Order }) {
  const [open, setOpen] = useState(false);
  const count = o.lines.reduce((s, l) => s + l.qty, 0);

  return (
    <>
      <div onClick={() => setOpen(true)} className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center -space-x-3">
             {o.lines.slice(0, 3).map((l, i) => (
                <img key={i} src={l.image} className="w-10 h-10 rounded-full border-2 border-black object-cover bg-white" alt="" />
             ))}
             {o.lines.length > 3 && (
                <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center text-xs font-black z-10">+{o.lines.length - 3}</div>
             )}
          </div>
          <div>
            <p className="font-black uppercase text-lg">{o.store_name}</p>
            <p className="text-xs font-bold text-gray-500">
              {count} item{count !== 1 ? 's' : ''} · ₹{o.total}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`border-4 border-black px-2 py-1 text-[10px] sm:text-xs font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-300' : o.status === 'out_for_delivery' ? 'bg-emerald-200' : o.status === 'accepted' ? 'bg-emerald-400' : (o.status === 'cancelled' || o.status === 'rejected') ? 'bg-red-300' : 'bg-yellow-300'}`}>{LABEL[o.status]}</span>
          <p className="text-[10px] font-bold text-gray-500">{new Date(o.placed_at).toLocaleDateString()}</p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-yellow-300">
              <h3 className="font-black uppercase text-lg">Order #{o.id}</h3>
              <button onClick={() => setOpen(false)} className="text-xl font-black px-2 hover:scale-110">×</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              <div className="text-sm font-bold flex flex-col gap-1">
                <p>Status: <span className="uppercase text-[#3B82F6]">{LABEL[o.status]}</span></p>
                {(o.status === 'cancelled' || o.status === 'rejected') && o.cancel_reason && <p className="text-red-500">Reason: {o.cancel_reason}</p>}
                <p>Placed: {new Date(o.placed_at).toLocaleString()}</p>
                <p>Address: {o.address}</p>
                <p>Payment: {o.payment_method}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <h4 className="font-black uppercase border-b-4 border-black pb-1 mb-1">Items</h4>
                {o.lines.map(l => (
                  <div className="flex gap-3 items-center" key={l.sku}>
                    <img src={l.image} className="w-12 h-12 border-4 border-black object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{l.title}</p>
                      <p className="text-xs font-bold text-gray-500">₹{l.price} × {l.qty}</p>
                    </div>
                    <p className="font-black">₹{l.price * l.qty}</p>
                  </div>
                ))}
              </div>

              <div className="text-sm font-bold flex flex-col gap-1 border-t-4 border-black pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{o.subtotal}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{o.delivery_fee === 0 ? 'FREE' : `₹${o.delivery_fee}`}</span></div>
                <div className="flex justify-between text-lg font-black mt-1"><span>Total</span><span>₹{o.total}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OrdersPage() {
  const { orders } = useShop();

  const sortedOrders = [...orders].sort((a, b) => {
    const isActiveA = !['delivered', 'cancelled', 'rejected'].includes(a.status);
    const isActiveB = !['delivered', 'cancelled', 'rejected'].includes(b.status);
    if (isActiveA && !isActiveB) return -1;
    if (!isActiveA && isActiveB) return 1;
    return new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime();
  });

  return (
    <div>
      <SectionTitle>Your orders</SectionTitle>
      {sortedOrders.length === 0
        ? <div className="bg-white border-4 border-black p-10 text-center font-black uppercase shadow-[4px_4px_0_0_#000]">No orders yet 📦</div>
        : <div className="flex flex-col gap-5 max-w-3xl">{sortedOrders.map(o => <OrderCard key={o.id} o={o} />)}</div>}
    </div>
  );
}
