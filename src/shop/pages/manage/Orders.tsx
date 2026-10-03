import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';

const API = '/api/shop_manage';
const LABEL: Record<string, string> = { placed: 'Placed', accepted: 'Processing', packed: 'Packed', out_for_delivery: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled', rejected: 'Declined' };

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const { refreshStore } = useOutletContext<any>();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [dontReaddStock, setDontReaddStock] = useState(false);

  // Determine active section based on pathname
  const isDeliver = pathname.includes('/deliver');
  const isActive = pathname.includes('/active');
  const isOrders = pathname.includes('/orders');

  const [tab, setTab] = useState('new');

  useEffect(() => {
    if (isDeliver) setTab('deliver');
    else if (isActive) setTab('active');
    else if (tab !== 'new' && tab !== 'all') setTab('new');
  }, [pathname]);

  const load = () => {
    setLoading(true);
    return fetch(API + '?action=orders')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setOrders(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let isCancelled = false;
    
    const fetchOrders = async () => {
      try {
        const r = await fetch(API + '?action=orders');
        const d = await r.json();
        if (d.status === 'success') {
          setOrders(prev => JSON.stringify(prev) === JSON.stringify(d.data) ? prev : d.data);
        }
      } catch (e) {
        // Ignore errors
      }
    };

    const poll = async () => {
      if (isCancelled) return;
      await fetchOrders();
      if (!isCancelled) setTimeout(poll, 5000);
    };

    load().then(() => {
      if (!isCancelled) setTimeout(poll, 5000);
    });

    return () => { isCancelled = true; };
  }, []);

  const updateStatus = async (orderId: number, status: string, reason = '', skipRestock = false) => {
    const res = await fetch(API + '?action=update_order_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status, cancel_reason: reason, dont_readd_stock: skipRestock })
    });
    const d = await res.json();
    if (d.status === 'success') {
      setSelectedOrder(null);
      setCancelReason('');
      setDontReaddStock(false);
      load();
      refreshStore();
    } else {
      alert(d.message || 'Error updating order');
    }
  };

  const getFilteredOrders = () => {
    if (tab === 'new') return orders.filter(o => o.status === 'placed');
    if (tab === 'active') return orders.filter(o => o.status === 'accepted' || o.status === 'packed');
    if (tab === 'deliver') return orders.filter(o => o.status === 'out_for_delivery');
    if (tab === 'all') return orders;
    return [];
  };

  const filtered = getFilteredOrders();

  return (
    <div className="p-4 md:p-8 flex-1 bg-[#FFF5E1] overflow-y-auto min-h-0">
      <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-4">
        {isDeliver ? 'To Deliver' : isActive ? 'Active Orders' : 'Orders'}
      </h2>

      {isOrders && (
        <div className="flex gap-4 mb-6 border-b-4 border-black pb-4 overflow-x-auto">
          <button onClick={() => setTab('new')} className={`font-black uppercase px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] transition-all whitespace-nowrap ${tab === 'new' ? 'bg-black text-white' : 'bg-white text-black'}`}>New Orders</button>
          <button onClick={() => setTab('all')} className={`font-black uppercase px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] transition-all whitespace-nowrap ${tab === 'all' ? 'bg-black text-white' : 'bg-white text-black'}`}>All Orders</button>
        </div>
      )}

      {loading ? (
        <div className="font-black uppercase animate-pulse">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-4 border-black p-8 font-black uppercase text-center shadow-[4px_4px_0_0_#000]">No orders found for this tab</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(o => {
            const date = new Date(o.placed_at).toLocaleString();
            return (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] transition-all cursor-pointer flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black uppercase bg-yellow-300 border-2 border-black px-2 py-0.5 text-xs">#{o.id}</span>
                  <span className="font-bold text-xs">{date}</span>
                </div>
                <div className="font-black text-xl mb-1 flex items-center justify-between">
                  <span>₹{o.total}</span>
                  <span className={`border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-300' : o.status === 'out_for_delivery' ? 'bg-emerald-200' : o.status === 'accepted' ? 'bg-emerald-400' : (o.status === 'cancelled' || o.status === 'rejected') ? 'bg-red-300' : 'bg-yellow-300'}`}>{LABEL[o.status]}</span>
                </div>
                <div className="text-sm font-bold text-gray-600 mb-2">{o.items.length} items</div>
                <div className="mt-auto">
                  <p className="font-bold uppercase text-xs break-words line-clamp-1">{o.address}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b-4 border-black bg-yellow-300 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-black uppercase">Order #{selectedOrder.id}</h2>
              <button onClick={() => { setSelectedOrder(null); setCancelReason(''); }} className="font-black text-xl px-2 hover:bg-black hover:text-white transition-colors">&times;</button>
            </div>
            
            <div className="p-6 flex-1">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-black uppercase border-b-4 border-black mb-2 pb-1">Customer Details</h3>
                  <p className="font-bold mb-1">Address: <span className="font-medium">{selectedOrder.address}</span></p>
                  <p className="font-bold mb-1">Mobile: <span className="font-medium">{selectedOrder.mobile}</span></p>
                  {selectedOrder.user_note && <p className="font-bold mb-1 text-red-600">Note: <span className="font-medium">{selectedOrder.user_note}</span></p>}
                </div>
                <div>
                  <h3 className="font-black uppercase border-b-4 border-black mb-2 pb-1">Order Summary</h3>
                  <p className="font-bold mb-1">Date: <span className="font-medium">{new Date(selectedOrder.placed_at).toLocaleString()}</span></p>
                  <p className="font-bold mb-1">Status: <span className="font-medium uppercase text-[#3B82F6]">{LABEL[selectedOrder.status]}</span></p>
                  {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'rejected') && selectedOrder.cancel_reason && <p className="font-bold mb-1 text-red-500">Reason: <span className="font-medium">{selectedOrder.cancel_reason}</span></p>}
                  <p className="font-bold mb-1">Method: <span className="font-medium uppercase">{selectedOrder.payment_method}</span></p>
                  <p className="font-bold mb-1">Subtotal: <span className="font-medium text-gray-700">₹{selectedOrder.subtotal}</span></p>
                  <p className="font-bold mb-1">Delivery Fee: <span className="font-medium text-gray-700">{selectedOrder.delivery_fee > 0 ? `₹${selectedOrder.delivery_fee}` : 'FREE'}</span></p>
                  <p className="font-black text-xl mt-2 border-t-2 border-black pt-2">Total: ₹{selectedOrder.total}</p>
                </div>
              </div>

              <h3 className="font-black uppercase border-b-4 border-black mb-2 pb-1">Items</h3>
              <div className="flex flex-col gap-2 mb-8">
                {selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 border-2 border-black">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt="" className="w-10 h-10 object-cover border-2 border-black" />}
                      <div>
                        <p className="font-black uppercase text-sm leading-tight">{item.title}</p>
                        <p className="font-bold text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black">x{item.quantity}</p>
                      <p className="font-bold text-sm">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions based on status */}
              <div className="flex flex-col gap-3">
                {selectedOrder.status === 'placed' && (
                  <>
                    <button onClick={() => updateStatus(selectedOrder.id, 'accepted')} className="w-full bg-[#3B82F6] text-white border-4 border-black p-4 font-black uppercase text-xl hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Proceed (Accept Order)</button>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-stretch">
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <input type="text" placeholder="Reject reason (e.g. Out of stock)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full border-4 border-black p-3 font-bold uppercase text-sm" />
                        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                          <input type="checkbox" checked={dontReaddStock} onChange={e => setDontReaddStock(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                          Don't re-add stock
                        </label>
                      </div>
                      <button onClick={() => { if(!cancelReason) return alert("Enter reason"); updateStatus(selectedOrder.id, 'rejected', cancelReason, dontReaddStock); }} className="bg-red-500 text-white border-4 border-black px-6 py-3 font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Decline</button>
                    </div>
                  </>
                )}

                {(selectedOrder.status === 'accepted' || selectedOrder.status === 'packed') && (
                  <>
                    <button onClick={() => updateStatus(selectedOrder.id, 'out_for_delivery')} className="w-full bg-yellow-300 text-black border-4 border-black p-4 font-black uppercase text-xl hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Mark as Out for Delivery</button>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-stretch mt-2 border-t-4 border-black pt-4">
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <input type="text" placeholder="Cancel reason" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full border-4 border-black p-3 font-bold uppercase text-sm" />
                        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                          <input type="checkbox" checked={dontReaddStock} onChange={e => setDontReaddStock(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                          Don't re-add stock
                        </label>
                      </div>
                      <button onClick={() => { if(!cancelReason) return alert("Enter reason"); updateStatus(selectedOrder.id, 'cancelled', cancelReason, dontReaddStock); }} className="bg-red-500 text-white border-4 border-black px-6 py-3 font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Cancel Order</button>
                    </div>
                  </>
                )}

                {selectedOrder.status === 'out_for_delivery' && (
                  <>
                    <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="w-full bg-emerald-400 text-black border-4 border-black p-4 font-black uppercase text-xl hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Mark as Delivered</button>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-stretch mt-2 border-t-4 border-black pt-4">
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <input type="text" placeholder="Cancel reason" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full border-4 border-black p-3 font-bold uppercase text-sm" />
                        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                          <input type="checkbox" checked={dontReaddStock} onChange={e => setDontReaddStock(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                          Don't re-add stock
                        </label>
                      </div>
                      <button onClick={() => { if(!cancelReason) return alert("Enter reason"); updateStatus(selectedOrder.id, 'cancelled', cancelReason, dontReaddStock); }} className="bg-red-500 text-white border-4 border-black px-6 py-3 font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Cancel Order</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
