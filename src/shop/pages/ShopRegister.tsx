import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ImagePlus, Loader2, Search, Store, UserPlus, X } from 'lucide-react';
import { CATEGORIES } from '../data/mock';

interface UserLite { id: number; email: string; name: string; rollno: string; avatar?: string }
interface App { id: number; name: string; status: string; created_at: string }

const API = '/api/shop_reg';

const MAX_IMG = 2 * 1024 * 1024; // 2MB

/** Reads the original file as a base64 data URI (stored as-is in the database). */
function toThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'));
    if (file.size > MAX_IMG) return reject(new Error('Image must be 2MB or smaller'));
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Could not read that image'));
    fr.readAsDataURL(file);
  });
}

const field = 'w-full border-4 border-black bg-white p-3 font-bold outline-none focus:shadow-[4px_4px_0_0_#3B82F6]';
const label = 'block font-black uppercase text-sm mb-1';

export default function ShopRegister() {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserLite | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [cats, setCats] = useState<number[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [customCats, setCustomCats] = useState<string[]>(['']);
  const [myMobile, setMyMobile] = useState('');
  const [mobiles, setMobiles] = useState<Record<number, string>>({});
  const [owners, setOwners] = useState<UserLite[]>([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch(API).then(r => r.json()).then(d => {
    if (d.status === 'success') { setMe(d.data.me); setApps(d.data.applications); } else navigate('/login');
  }).catch(() => navigate('/login')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // Debounced owner search (by email / roll no / name)
  useEffect(() => {
    if (q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`${API}?action=search&q=${encodeURIComponent(q.trim())}`).then(r => r.json())
        .then(d => setResults(d.status === 'success' ? d.data.filter((u: UserLite) => !owners.some(o => o.id === u.id)) : []))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q, owners]);

  const pickFile = async (f?: File) => {
    if (!f) return;
    try { setThumbnail(await toThumb(f)); setError(''); } catch (e: any) { setError(e.message || 'Could not read that image'); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!thumbnail) return setError('Please add a thumbnail image');
    const isMobile = (m: string) => /^\d{10}$/.test(m.replace(/\D/g, ''));
    if (!isMobile(myMobile)) return setError('Enter a valid 10-digit mobile number for yourself');
    for (const o of owners) if (!isMobile(mobiles[o.id] || '')) return setError(`Enter a valid 10-digit mobile number for ${o.name || o.email}`);
    const custom = otherOn ? customCats.map(c => c.trim()).filter(Boolean) : [];
    if (cats.length === 0 && custom.length === 0) return setError('Select at least one category (or fill in Other)');
    setSubmitting(true);
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, thumbnail, categories: cats, custom_categories: custom,
          owners: [{ ident: me?.email, mobile: myMobile }, ...owners.map(o => ({ ident: o.email, mobile: mobiles[o.id] }))],
        }),
      });
      const d = await r.json();
      if (d.status === 'success') { setDoneId(d.data.id); load(); } else setError(d.message || 'Submission failed');
    } catch { setError('Network error'); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF5E1]"><div className="text-2xl font-black uppercase tracking-widest animate-pulse">Loading...</div></div>;

  if (doneId) {
    return (
      <div className="min-h-screen bg-[#FFF5E1] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-300 border-4 border-black mx-auto flex items-center justify-center mb-4"><Check size={36} strokeWidth={4} /></div>
          <h1 className="text-3xl font-black uppercase">Application sent!</h1>
          <p className="font-bold mt-2">Reference #{doneId}. We'll review your shop and get back to you.</p>
          <Link to="/shop" className="inline-block mt-6 bg-[#3B82F6] text-white border-4 border-black px-6 py-3 font-black uppercase shadow-[4px_4px_0_0_#000]">Go to shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E1] text-black font-sans">
      <header className="border-b-4 border-black px-4 sm:px-8 py-3 flex items-center gap-3 sticky top-0 bg-[#FFF5E1] z-10">
        <Link to="/shop" aria-label="Back" className="bg-white border-4 border-black p-2 shadow-[3px_3px_0_0_#000]"><ArrowLeft size={16} strokeWidth={3} /></Link>
        <div className="font-black uppercase text-xl bg-white border-4 border-black px-3 py-1 shadow-[4px_4px_0_0_#000] -rotate-1">SST <span className="text-white bg-[#3B82F6] px-2 border-2 border-black">Seller</span></div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 flex flex-col gap-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none flex items-center gap-3"><Store size={40} /> Register your shop</h1>
          <p className="font-bold mt-2 text-gray-700">Tell us about your shop. Applications are reviewed before going live on SST Shop.</p>
        </div>

        {apps.length > 0 && (
          <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#000] p-4">
            <p className="font-black uppercase text-sm mb-2">Your applications</p>
            {apps.map(a => (
              <div key={a.id} className="flex justify-between items-center border-t-2 border-black py-2 font-bold text-sm">
                <span>#{a.id} · {a.name}</span>
                <span className={`px-2 border-2 border-black uppercase text-xs font-black ${a.status === 'approved' ? 'bg-emerald-300' : a.status === 'rejected' ? 'bg-red-300' : 'bg-yellow-300'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-5 sm:p-8 flex flex-col gap-6">
          <div>
            <label className={label} htmlFor="shop-name">Shop name</label>
            <input id="shop-name" className={field} value={name} onChange={e => setName(e.target.value)} required minLength={3} maxLength={80} placeholder="e.g. Midnight Munchies" />
          </div>

          <div>
            <label className={label} htmlFor="shop-desc">Description</label>
            <textarea id="shop-desc" className={field + ' min-h-28'} value={description} onChange={e => setDescription(e.target.value)} required minLength={10} maxLength={1000} placeholder="What do you sell? Timings, specialties..." />
            <p className="text-xs font-bold text-right text-gray-500">{description.length}/1000</p>
          </div>

          <div>
            <span className={label}>Featured thumbnail <span className="text-gray-500 normal-case">(max 2MB)</span></span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => pickFile(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-44 border-4 border-dashed border-black bg-[#FFF5E1] flex flex-col items-center justify-center font-black uppercase overflow-hidden hover:bg-yellow-100 transition-colors">
              {thumbnail ? <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" /> : <><ImagePlus size={36} /> Upload image</>}
            </button>
          </div>

          <div>
            <span className={label}>Owners</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {me && <span className="flex items-center gap-2 bg-[#3B82F6] text-white border-4 border-black px-3 py-1 font-black text-sm">{me.email} <span className="bg-black px-1 text-[10px]">YOU</span></span>}
              {owners.map(o => (
                <span key={o.id} className="flex items-center gap-2 bg-yellow-300 border-4 border-black px-3 py-1 font-black text-sm">
                  {o.name || o.email} · {o.rollno}
                  <button type="button" aria-label="Remove owner" onClick={() => setOwners(owners.filter(x => x.id !== o.id))}><X size={16} strokeWidth={3} /></button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase w-24 shrink-0">Your mobile</span>
                <input type="tel" inputMode="numeric" className={field} value={myMobile} onChange={e => setMyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" required />
              </div>
              {owners.map(o => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase w-24 shrink-0 truncate">{o.name || o.rollno}</span>
                  <input type="tel" inputMode="numeric" className={field} value={mobiles[o.id] || ''} onChange={e => setMobiles({ ...mobiles, [o.id]: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Their 10-digit mobile number" required />
                </div>
              ))}
            </div>
            <div className="flex items-stretch border-4 border-black">
              <div className="px-3 flex items-center bg-white">{searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}</div>
              <input className="flex-1 p-3 font-bold outline-none min-w-0" value={q} onChange={e => setQ(e.target.value)} placeholder="Add co-owner by email, roll no or name (min 3 chars)" />
            </div>
            {results.length > 0 && (
              <div className="border-4 border-t-0 border-black">
                {results.map(u => (
                  <button type="button" key={u.id} onClick={() => { setOwners([...owners, u]); setQ(''); setResults([]); }} className="w-full flex items-center justify-between gap-2 p-3 text-left font-bold hover:bg-[#FFF5E1] border-b-2 border-black last:border-b-0">
                    <span className="truncate">{u.name} · {u.rollno}<span className="block text-xs text-gray-500">{u.email}</span></span>
                    <UserPlus size={18} />
                  </button>
                ))}
              </div>
            )}
            {q.trim().length >= 3 && !searching && results.length === 0 && <p className="text-xs font-bold mt-2 text-gray-600">No registered user found. They must sign up on SST Hub first.</p>}
          </div>

          <div>
            <span className={label}>Categories <span className="text-gray-500 normal-case">(pick one or more)</span></span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const on = cats.includes(c.id);
                return (
                  <button type="button" key={c.id} onClick={() => setCats(on ? cats.filter(x => x !== c.id) : [...cats, c.id])}
                    className={`px-3 py-2 border-4 border-black font-black uppercase text-xs transition-all ${on ? 'bg-[#3B82F6] text-white shadow-[3px_3px_0_0_#000]' : 'bg-white hover:-translate-y-0.5'}`}>
                    {on && <Check size={12} className="inline mr-1" strokeWidth={4} />}{c.name}
                  </button>
                );
              })}
              <button type="button" onClick={() => setOtherOn(!otherOn)}
                className={`px-3 py-2 border-4 border-black font-black uppercase text-xs transition-all ${otherOn ? 'bg-yellow-300 shadow-[3px_3px_0_0_#000]' : 'bg-white hover:-translate-y-0.5'}`}>
                {otherOn && <Check size={12} className="inline mr-1" strokeWidth={4} />}Other
              </button>
            </div>
            {otherOn && (
              <div className="mt-3 flex flex-col gap-2">
                {customCats.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={field} value={c} maxLength={40} placeholder="Custom category (e.g. Handmade crafts)" onChange={e => setCustomCats(customCats.map((x, j) => j === i ? e.target.value : x))} />
                    {customCats.length > 1 && <button type="button" aria-label="Remove" onClick={() => setCustomCats(customCats.filter((_, j) => j !== i))} className="border-4 border-black bg-white px-3"><X size={16} strokeWidth={3} /></button>}
                  </div>
                ))}
                {customCats.length < 5 && <button type="button" onClick={() => setCustomCats([...customCats, ''])} className="self-start font-black uppercase text-xs underline decoration-4 decoration-[#3B82F6]">+ Add another</button>}
              </div>
            )}
          </div>

          {error && <div className="bg-red-300 border-4 border-black p-3 font-black text-sm">{error}</div>}

          <button disabled={submitting} className="bg-[#3B82F6] text-white border-4 border-black py-4 font-black uppercase text-lg shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all disabled:opacity-50 disabled:hover:translate-y-0">
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
      </main>
    </div>
  );
}
