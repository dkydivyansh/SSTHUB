import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Edit2, ImagePlus, Trash2, X, AlertTriangle, Save } from 'lucide-react';
import ImageCropperModal from '../../components/ImageCropperModal';
const API = '/api/shop_manage';

function ConfirmModal({ show, onConfirm, onCancel, msg }: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-6 max-w-sm w-full text-center shadow-[8px_8px_0_0_#000]">
        <div className="w-16 h-16 bg-red-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-white"><AlertTriangle size={32} /></div>
        <h3 className="font-black text-xl uppercase mb-2">Are you sure?</h3>
        <p className="font-bold mb-6">{msg}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 border-4 border-black font-black uppercase py-2 hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white border-4 border-black font-black uppercase py-2 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { store } = useOutletContext<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  
  const [editing, setEditing] = useState<any>(null); // null means list view, object means form
  
  const [cats, setCats] = useState<any[]>([]);
  
  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(API + '?action=products&q=' + encodeURIComponent(q)).then(r => r.json()),
      fetch('/api/shop_catalog').then(r => r.json())
    ]).then(([d, catRes]) => {
      if (d.status === 'success') setProducts(d.data);
      if (catRes.status === 'success') setCats(catRes.data.categories);
    }).finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, [q]);

  const handleCreate = () => {
    setEditing({
      id: 0, title: '', description: '', price: '', discounted_price: '',
      quantity: 1, unit: 'pc', available_to: [...store.campus],
      info: {}, featured_image: '', gallery: [], categories: [], is_active: true
    });
  };

  if (editing) return <ProductForm store={store} p={editing} cats={cats} onBack={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-3xl font-black uppercase">Products</h2>
        <button onClick={handleCreate} className="bg-[#3B82F6] text-white border-4 border-black px-6 py-3 font-black uppercase flex items-center gap-2 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all">
          <Plus /> Add Product
        </button>
      </div>

      <div className="flex items-stretch border-4 border-black mb-8 bg-white max-w-md">
        <div className="px-3 flex items-center"><Search size={18} /></div>
        <input className="flex-1 p-3 font-bold outline-none" placeholder="Search by name or SKU..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {loading ? <p className="font-black uppercase animate-pulse">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...products].sort((a, b) => {
            const score = (p: any) => p.quantity <= 0 ? 0 : p.quantity <= 5 ? 1 : 2;
            return score(a) - score(b);
          }).map(p => (
            <div key={p.id} className={`border-4 border-black bg-white flex flex-col hover:-translate-y-1 transition-all shadow-[6px_6px_0_0_#000] ${!p.is_active ? 'opacity-60' : ''}`}>
              <div className="h-48 border-b-4 border-black bg-gray-100 overflow-hidden relative">
                {p.featured_image ? <img src={p.featured_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImagePlus className="text-gray-400" size={48} /></div>}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {!p.is_active && <div className="bg-black text-white px-2 py-1 text-xs font-black uppercase border-2 border-black">Draft</div>}
                  {p.quantity <= 0 && <div className="bg-red-500 text-white px-2 py-1 text-xs font-black uppercase border-2 border-black">Out of stock</div>}
                  {p.quantity > 0 && p.quantity <= 5 && <div className="bg-orange-400 text-black px-2 py-1 text-xs font-black uppercase border-2 border-black">Low Stock: {p.quantity}</div>}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-bold text-gray-500 mb-1 flex justify-between items-center">
                  <span>{p.sku}</span>
                  <span className={`px-1.5 py-0.5 border-2 border-black text-[10px] font-black uppercase ${p.quantity <= 0 ? 'bg-red-200 text-red-800' : p.quantity <= 5 ? 'bg-orange-200 text-orange-800' : 'bg-emerald-200 text-emerald-800'}`}>
                    Stock: {p.quantity}
                  </span>
                </div>
                <h3 className="font-black text-lg uppercase leading-tight mb-2 line-clamp-2">{p.title}</h3>
                <div className="font-black text-xl mb-4">₹{p.discounted_price || p.price} {p.discounted_price ? <span className="line-through text-sm text-gray-500">₹{p.price}</span> : ''}</div>
                <button onClick={() => setEditing(p)} className="mt-auto w-full bg-yellow-300 border-4 border-black py-2 font-black uppercase flex items-center justify-center gap-2 hover:bg-yellow-400">
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <div className="col-span-full border-4 border-dashed border-black p-12 text-center bg-white"><p className="font-black uppercase text-gray-500">No products found.</p></div>}
        </div>
      )}
    </div>
  );
}

function ProductForm({ store, p, cats, onBack, onSave }: any) {
  const [f, setF] = useState({ ...p });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'featured' | number | null>(null); // 'featured' or index in gallery
  
  const [delPrompt, setDelPrompt] = useState<{ url: string, target: 'featured' | number } | null>(null);

  const field = "w-full border-4 border-black p-3 font-bold outline-none focus:shadow-[4px_4px_0_0_#000] transition-shadow";
  const label = "block font-black uppercase text-sm mb-2";

  const handleUpload = async (file: File, target: 'featured' | number) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch(API + '?action=upload_image', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.status === 'success') {
        if (target === 'featured') setF({ ...f, featured_image: d.url });
        else {
          const g = [...f.gallery];
          if (target === g.length) g.push(d.url); else g[target] = d.url;
          setF({ ...f, gallery: g });
        }
      } else setError(d.message);
    } catch { setError('Upload failed'); }
  };

  const handleFileSelect = (e: any, target: 'featured' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError('Image must be under 2MB');
    
    if (target === 'featured') {
      // Need square crop
      const r = new FileReader();
      r.onload = () => { setCropFile(r.result as string); setCropTarget('featured'); };
      r.readAsDataURL(file);
    } else {
      handleUpload(file, target);
    }
  };

  const deleteImage = async () => {
    if (!delPrompt) return;
    const { url, target } = delPrompt;
    setDelPrompt(null);
    try {
      await fetch(API, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete_image', url }) });
    } catch {} // ignore
    if (target === 'featured') setF({ ...f, featured_image: '' });
    else setF({ ...f, gallery: f.gallery.filter((_:any, i:number) => i !== target) });
  };

  const save = async (e: any) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch(API, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'product_save', ...f }) });
      const d = await r.json();
      if (d.status === 'success') onSave(); else setError(d.message);
    } catch { setError('Network error'); }
    setSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <ConfirmModal show={!!delPrompt} msg="Delete this image permanently?" onConfirm={deleteImage} onCancel={() => setDelPrompt(null)} />
      {cropFile && <ImageCropperModal image={cropFile} onCancel={() => setCropFile(null)} onCrop={file => { setCropFile(null); handleUpload(file, cropTarget!); }} />}
      
      <button onClick={onBack} className="font-black uppercase mb-6 flex items-center gap-2 hover:-translate-x-1 transition-all"><X size={20} /> Back to Products</button>
      
      <form onSubmit={save} className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b-4 border-black pb-4">
          <h2 className="text-2xl font-black uppercase">{f.id ? 'Edit Product' : 'New Product'}</h2>
          <label className="flex items-center gap-2 cursor-pointer border-4 border-black px-4 py-2 hover:bg-gray-100 font-black uppercase">
            <input type="checkbox" checked={f.is_active} onChange={e => setF({...f, is_active: e.target.checked})} className="w-5 h-5 accent-black" /> Publish
          </label>
        </div>

        {error && <div className="bg-red-300 border-4 border-black p-4 font-black uppercase">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2"><span className={label}>Title</span><input required className={field} value={f.title} onChange={e=>setF({...f, title: e.target.value})} placeholder="Product name" /></div>
          <div><span className={label}>Price (₹)</span><input required type="number" step="0.01" className={field} value={f.price} onChange={e=>setF({...f, price: e.target.value})} /></div>
          <div><span className={label}>Discount Price (₹) (Optional)</span><input type="number" step="0.01" className={field} value={f.discounted_price} onChange={e=>setF({...f, discounted_price: e.target.value})} /></div>
          <div><span className={label}>Stock Quantity</span><input required type="number" className={field} value={f.quantity} onChange={e=>setF({...f, quantity: e.target.value})} /></div>
          <div><span className={label}>Unit</span><input required className={field} value={f.unit} onChange={e=>setF({...f, unit: e.target.value})} placeholder="pc, kg, ml..." /></div>
        </div>

        <div>
          <span className={label}>Description</span>
          <textarea required className={field + " h-32"} value={f.description} onChange={e=>setF({...f, description: e.target.value})} />
        </div>

        <div>
          <span className={label}>Available Campuses</span>
          <div className="flex flex-wrap gap-2">
            {store.campus.map((c: string) => {
              const on = f.available_to.includes(c);
              return <button key={c} type="button" onClick={() => setF({...f, available_to: on ? f.available_to.filter((x:any) => x!==c) : [...f.available_to, c]})} className={`px-4 py-2 border-4 border-black font-black uppercase text-sm transition-all ${on ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0_0_#000]' : 'bg-white'}`}>{c}</button>
            })}
          </div>
        </div>
        
        <div>
          <span className={label}>Product Info (Key-Value pairs like Weight, Ingredients, etc.)</span>
          <div className="flex flex-col gap-2 mb-4">
            {Object.entries(f.info).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <input className={field} value={k} readOnly disabled />
                <input className={field} value={v as string} onChange={e => setF({...f, info: {...f.info, [k]: e.target.value}})} />
                <button type="button" onClick={() => { const newInfo = {...f.info}; delete newInfo[k]; setF({...f, info: newInfo}); }} className="bg-red-500 text-white px-4 border-4 border-black font-black hover:-translate-y-1"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input id="newInfoKey" className={field} placeholder="New key (e.g. Weight)" />
              <input id="newInfoVal" className={field} placeholder="Value (e.g. 500g)" />
              <button type="button" onClick={() => {
                const k = (document.getElementById('newInfoKey') as HTMLInputElement).value.trim();
                const v = (document.getElementById('newInfoVal') as HTMLInputElement).value.trim();
                if (k && v) { setF({...f, info: {...f.info, [k]: v}}); (document.getElementById('newInfoKey') as HTMLInputElement).value = ''; (document.getElementById('newInfoVal') as HTMLInputElement).value = ''; }
              }} className="bg-emerald-400 text-black px-4 border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-1">Add</button>
            </div>
          </div>
        </div>
        
        <div>
          <span className={label}>Categories</span>
          <div className="flex flex-wrap gap-2 border-4 border-black p-4 max-h-48 overflow-y-auto bg-gray-50">
            {cats.map((c: any) => (
              <label key={c.id} className="flex items-center gap-2 p-2 border-4 border-black bg-white cursor-pointer hover:bg-gray-100">
                <input type="checkbox" className="accent-black w-4 h-4" checked={f.categories.includes(c.id)} onChange={e => setF({...f, categories: e.target.checked ? [...f.categories, c.id] : f.categories.filter((x:any)=>x!==c.id)})} />
                <span className="font-bold">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t-4 border-black pt-6">
          <span className={label}>Featured Image (Square)</span>
          <div className="flex gap-4">
            {f.featured_image ? (
              <div className="relative w-40 h-40 border-4 border-black bg-gray-100">
                <img src={f.featured_image} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setDelPrompt({ url: f.featured_image, target: 'featured' })} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 border-4 border-black hover:-translate-y-1 shadow-[4px_4px_0_0_#000]"><Trash2 size={16} strokeWidth={3} /></button>
              </div>
            ) : (
              <label className="w-40 h-40 border-4 border-dashed border-black flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-100 text-gray-500 hover:text-black transition-all">
                <ImagePlus size={32} className="mb-2" />
                <span className="font-black uppercase text-xs">Upload</span>
                <input type="file" accept="image/png, image/jpeg, image/webp" hidden onChange={e => handleFileSelect(e, 'featured')} />
              </label>
            )}
          </div>
        </div>
        
        <div>
          <span className={label}>Gallery (Up to 9 images)</span>
          <div className="flex flex-wrap gap-4">
            {f.gallery.map((g: string, i: number) => (
              <div key={i} className="relative w-24 h-24 border-4 border-black bg-gray-100">
                <img src={g} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setDelPrompt({ url: g, target: i })} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 border-4 border-black hover:-translate-y-1 shadow-[2px_2px_0_0_#000]"><Trash2 size={14} strokeWidth={3} /></button>
              </div>
            ))}
            {f.gallery.length < 9 && (
              <label className="w-24 h-24 border-4 border-dashed border-black flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-100 text-gray-400 hover:text-black transition-all">
                <Plus size={24} />
                <input type="file" accept="image/png, image/jpeg, image/webp" hidden onChange={e => handleFileSelect(e, f.gallery.length)} />
              </label>
            )}
          </div>
        </div>

        <button disabled={submitting} className="bg-emerald-400 text-black border-4 border-black py-4 font-black uppercase text-xl flex items-center justify-center gap-2 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all disabled:opacity-50">
          <Save /> Save Product
        </button>
      </form>
    </div>
  );
}
