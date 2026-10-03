import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Store, X } from 'lucide-react';
import { CAMPUSES } from '../types';

const API = '/api/shop_admin';

export default function ShopAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [tab, setTab] = useState<'apps' | 'live' | 'cats'>('apps');

  const [editingCat, setEditingCat] = useState<any>(null);
  const [catImageFile, setCatImageFile] = useState<File | null>(null);

  const [reviewId, setReviewId] = useState<number | null>(null);
  const [appDetails, setAppDetails] = useState<any>(null);
  const [mapForm, setMapForm] = useState<any>({});
  const [campus, setCampus] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAll = () => {
    Promise.all([
      fetch(`${API}?action=applications`).then(r => r.json()),
      fetch(`${API}?action=categories`).then(r => r.json()),
      fetch(`${API}?action=live`).then(r => r.json())
    ]).then(([dApps, dCats, dLive]) => {
      if (dApps.status !== 'success') return navigate('/dash');
      setApps(dApps.data); setCats(dCats.data); setLive(dLive.data);
    }).catch(() => navigate('/dash')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`${API}?action=me`).then(r => r.json()).then(d => {
      if (d.status !== 'success' || !d.data.is_admin) navigate('/dash');
      else loadAll();
    }).catch(() => navigate('/dash'));
  }, []);

  const openReview = (id: number) => {
    setReviewId(id); setAppDetails(null); setError('');
    fetch(`${API}?action=application&id=${id}`).then(r => r.json()).then(d => {
      if (d.status === 'success') {
        setAppDetails(d.data);
        const m: any = {};
        d.data.custom_categories.forEach((c: string) => { m[c] = { mode: 'new', category_id: '' }; });
        setMapForm(m);
        setCampus(d.data.campus || []);
      }
    });
  };

  const submitReview = (action: 'merge' | 'reject') => {
    setError(''); setActionLoading(true);
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: reviewId, map: mapForm, campus })
    }).then(r => r.json()).then(d => {
      if (d.status === 'success') { setReviewId(null); loadAll(); }
      else setError(d.message);
    }).catch(() => setError('Network error')).finally(() => setActionLoading(false));
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true); setError('');
    try {
      let imageUrl = editingCat.image;
      if (catImageFile) {
        const fd = new FormData();
        fd.append('file', catImageFile);
        const r1 = await fetch(`${API}?action=category_image`, { method: 'POST', body: fd });
        const d1 = await r1.json();
        if (d1.status !== 'success') throw new Error(d1.message || 'Image upload failed');
        imageUrl = d1.url;
      }
      const r2 = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'category_save', ...editingCat, image: imageUrl })
      });
      const d2 = await r2.json();
      if (d2.status === 'success') { setEditingCat(null); loadAll(); }
      else throw new Error(d2.message);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-xl font-black uppercase">Loading Admin...</div>;

  return (
    <div className="min-h-screen bg-[#FFF5E1] p-4 sm:p-8">
      <h1 className="text-3xl font-black uppercase mb-6 flex items-center gap-2"><Store /> Shop Admin</h1>
      
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('apps')} className={`px-4 py-2 border-4 border-black font-black uppercase ${tab === 'apps' ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white hover:-translate-y-1'}`}>Applications</button>
        <button onClick={() => setTab('live')} className={`px-4 py-2 border-4 border-black font-black uppercase ${tab === 'live' ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white hover:-translate-y-1'}`}>Live Stores</button>
        <button onClick={() => setTab('cats')} className={`px-4 py-2 border-4 border-black font-black uppercase ${tab === 'cats' ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white hover:-translate-y-1'}`}>Categories</button>
      </div>

      {tab === 'apps' && (
        <div className="grid gap-4">
          {apps.map(a => (
            <div key={a.id} className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-black uppercase text-xl">#{a.id} {a.name}</p>
                <p className="font-bold text-sm text-gray-600">By {a.applicant.name} ({a.applicant.email}) · {a.custom_count} custom categories</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 border-2 border-black font-black uppercase text-xs ${a.status === 'pending' ? 'bg-yellow-300' : a.status === 'approved' ? 'bg-emerald-300' : 'bg-red-300'}`}>{a.status}</span>
                {a.status === 'pending' && <button onClick={() => openReview(a.id)} className="bg-black text-white px-3 py-1 font-black uppercase text-sm hover:-translate-y-1 transition-all">Review</button>}
              </div>
            </div>
          ))}
          {apps.length === 0 && <p className="font-bold">No applications found.</p>}
        </div>
      )}

      {tab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {live.map(s => (
            <div key={s.id} className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] flex overflow-hidden group">
              {s.has_image ? <img src={`${API}?action=store_image&id=${s.id}`} alt="" className="w-24 object-cover border-r-4 border-black" /> : <div className="w-24 bg-gray-200 border-r-4 border-black" />}
              <div className="p-3 min-w-0 flex-1">
                <p className="font-black uppercase truncate text-lg">{s.name}</p>
                <p className="font-bold text-sm text-gray-600 mb-1">{s.campus.replace(/,/g, ', ')}</p>
                <div className="flex gap-2">
                  <span className={`px-1.5 border-2 border-black text-[10px] font-black uppercase ${s.is_active ? 'bg-emerald-300' : 'bg-red-300'}`}>{s.is_active ? 'Active' : 'Hidden'}</span>
                  <span className={`px-1.5 border-2 border-black text-[10px] font-black uppercase ${s.is_open ? 'bg-emerald-300' : 'bg-red-300'}`}>{s.is_open ? 'Open' : 'Closed'}</span>
                </div>
                <p className="font-black mt-2">{s.product_count} products</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cats' && !editingCat && (
        <div>
          <button onClick={() => { setEditingCat({ id: 0, name: '', slug: '', image: '', is_active: true }); setCatImageFile(null); }} className="mb-6 bg-black text-white px-6 py-2 font-black uppercase shadow-[4px_4px_0_0_#FFF5E1] border-4 border-black hover:-translate-y-1">
            + New Category
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cats.map(c => (
              <div key={c.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col items-center gap-2 text-center">
                <img src={c.image || 'https://via.placeholder.com/150'} alt="" className="w-24 h-24 object-cover border-4 border-black bg-gray-100" />
                <h3 className="font-black uppercase text-lg">{c.name}</h3>
                <p className="text-xs font-bold text-gray-500">Products: {c.product_count || 0}</p>
                <div className="mt-2 flex gap-2">
                  <span className={`text-xs px-2 py-1 border-2 border-black font-black uppercase ${c.is_active ? 'bg-emerald-300' : 'bg-red-300'}`}>{c.is_active ? 'Active' : 'Hidden'}</span>
                  <button onClick={() => { setEditingCat(c); setCatImageFile(null); }} className="text-xs px-2 py-1 border-2 border-black bg-yellow-300 font-black uppercase hover:-translate-y-1">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cats' && editingCat && (
        <form onSubmit={submitCategory} className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-6 sm:p-8 max-w-2xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center border-b-4 border-black pb-4">
            <h2 className="text-2xl font-black uppercase">{editingCat.id ? 'Edit Category' : 'New Category'}</h2>
            <button type="button" onClick={() => setEditingCat(null)} className="hover:bg-red-500 hover:text-white p-1 border-2 border-transparent hover:border-black transition-all"><X /></button>
          </div>
          {error && <div className="bg-red-300 border-4 border-black p-4 font-black uppercase">{error}</div>}
          
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase text-sm">Name</label>
            <input required value={editingCat.name} onChange={e => setEditingCat({...editingCat, name: e.target.value, slug: editingCat.id ? editingCat.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="border-4 border-black p-3 font-bold" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase text-sm">Slug</label>
            <input required value={editingCat.slug} onChange={e => setEditingCat({...editingCat, slug: e.target.value})} className="border-4 border-black p-3 font-bold" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase text-sm">Image</label>
            <div className="flex items-center gap-4">
              <img src={catImageFile ? URL.createObjectURL(catImageFile) : (editingCat.image || 'https://via.placeholder.com/150')} alt="" className="w-24 h-24 object-cover border-4 border-black bg-gray-100" />
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setCatImageFile(e.target.files[0])} className="font-bold text-sm" />
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer font-black uppercase">
            <input type="checkbox" checked={editingCat.is_active} onChange={e => setEditingCat({...editingCat, is_active: e.target.checked})} className="w-5 h-5 accent-black" />
            Active (Visible)
          </label>
          
          <button disabled={actionLoading} className="bg-emerald-400 text-black border-4 border-black py-3 font-black uppercase hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all disabled:opacity-50">
            {actionLoading ? 'Saving...' : 'Save Category'}
          </button>
        </form>
      )}

      {reviewId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-3xl my-8">
            <div className="p-4 border-b-4 border-black flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black uppercase">Review #{reviewId}</h2>
              <button onClick={() => setReviewId(null)}><X size={28} strokeWidth={3} /></button>
            </div>
            
            {!appDetails ? <div className="p-8 text-center font-bold">Loading details...</div> : (
              <div className="p-4 sm:p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <img src={`${API}?action=thumb&id=${reviewId}`} alt="" className="w-full sm:w-48 h-48 object-cover border-4 border-black shadow-[4px_4px_0_0_#000] shrink-0" />
                  <div>
                    <h3 className="text-3xl font-black uppercase mb-2">{appDetails.name}</h3>
                    <p className="font-bold text-gray-700 whitespace-pre-wrap">{appDetails.description}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase border-b-2 border-black mb-2">Owners</h4>
                  <div className="flex flex-wrap gap-2">
                    {appDetails.owners.map((o: any) => (
                      <div key={o.id} className="border-4 border-black px-2 py-1 bg-[#FFF5E1]">
                        <p className="font-black text-sm">{o.name} <span className="font-normal text-xs text-gray-600">({o.rollno})</span></p>
                        <p className="font-bold text-xs">{o.email}</p>
                        <p className="font-black text-xs text-[#3B82F6]">📞 {o.mobile}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase border-b-2 border-black mb-2">Campuses <span className="text-red-500">*</span></h4>
                  <div className="flex flex-wrap gap-2">
                    {CAMPUSES.map(c => {
                      const on = campus.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => setCampus(on ? campus.filter(x => x !== c.id) : [...campus, c.id])} className={`px-3 py-1 border-4 border-black font-black uppercase text-xs ${on ? 'bg-[#3B82F6] text-white' : 'bg-white'}`}>
                          {on && <Check size={12} className="inline mr-1" strokeWidth={4} />}{c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase border-b-2 border-black mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {appDetails.categories.map((c: any) => (
                      <span key={c.id} className="bg-gray-200 border-2 border-black px-2 py-0.5 text-xs font-black uppercase">{c.name}</span>
                    ))}
                  </div>

                  {appDetails.custom_categories.length > 0 && (
                    <div className="bg-yellow-100 border-4 border-black p-3">
                      <p className="font-black uppercase text-sm mb-3">Map Custom Categories</p>
                      <div className="flex flex-col gap-3">
                        {appDetails.custom_categories.map((c: string) => (
                          <div key={c} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <span className="font-bold w-1/3 truncate">"{c}" &rarr;</span>
                            <select className="border-4 border-black p-1 font-bold outline-none flex-1 min-w-0" value={mapForm[c].mode} onChange={e => setMapForm({...mapForm, [c]: { ...mapForm[c], mode: e.target.value }})}>
                              <option value="new">Create as New</option>
                              <option value="map">Map to Existing</option>
                            </select>
                            {mapForm[c].mode === 'map' && (
                              <select className="border-4 border-black p-1 font-bold outline-none flex-1 min-w-0 bg-white" value={mapForm[c].category_id} onChange={e => setMapForm({...mapForm, [c]: { ...mapForm[c], category_id: e.target.value }})}>
                                <option value="">-- Select --</option>
                                {cats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && <div className="bg-red-300 border-4 border-black p-3 font-black text-sm">{error}</div>}

                <div className="flex gap-4 pt-4 border-t-4 border-black">
                  <button disabled={actionLoading} onClick={() => submitReview('merge')} className="flex-1 bg-emerald-400 text-black border-4 border-black py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all disabled:opacity-50">Approve & Merge</button>
                  <button disabled={actionLoading} onClick={() => submitReview('reject')} className="flex-1 bg-red-400 text-black border-4 border-black py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all disabled:opacity-50">Reject</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
