import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save } from 'lucide-react';
import { CAMPUSES } from '../../types';

const API = '/api/shop_manage';

export default function Settings() {
  const { store } = useOutletContext<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [f, setF] = useState({
    opens_at: '',
    closes_at: '',
    is_open: true,
    campus: [] as string[]
  });

  useEffect(() => {
    fetch(API + '?action=store_settings_get')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setF({
            opens_at: d.data.opens_at ? d.data.opens_at.slice(0, 5) : '',
            closes_at: d.data.closes_at ? d.data.closes_at.slice(0, 5) : '',
            is_open: Boolean(d.data.is_open),
            campus: d.data.campus || []
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.campus.length === 0) return setError('Select at least one campus');
    setError(''); setSuccess(''); setSaving(true);
    
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'store_settings_save', ...f })
      });
      const d = await r.json();
      if (d.status === 'success') {
        setSuccess('Settings saved successfully!');
        // Refresh store context in layout if needed (not strictly necessary here as it reads from API on load)
      } else {
        setError(d.message || 'Failed to save settings');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-black uppercase text-xl animate-pulse">Loading settings...</div>;

  const field = "w-full border-4 border-black p-3 font-bold outline-none focus:shadow-[4px_4px_0_0_#000] transition-shadow";
  const label = "block font-black uppercase text-sm mb-2";

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black uppercase mb-8">Store Settings</h2>
      
      {store.role !== 'owner' ? (
        <div className="bg-yellow-300 border-4 border-black p-6 font-black uppercase text-center shadow-[4px_4px_0_0_#000]">
          Only store owners can modify store settings.
        </div>
      ) : (
        <form onSubmit={save} className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-6 md:p-8 flex flex-col gap-6">
          {error && <div className="bg-red-300 border-4 border-black p-4 font-black uppercase">{error}</div>}
          {success && <div className="bg-emerald-300 border-4 border-black p-4 font-black uppercase">{success}</div>}

          <div>
            <label className="flex items-center gap-3 cursor-pointer border-4 border-black p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={f.is_open} onChange={e => setF({...f, is_open: e.target.checked})} className="w-6 h-6 accent-black" />
              <div className="flex flex-col">
                <span className="font-black uppercase text-lg leading-none">Store is Open</span>
                <span className="font-bold text-gray-500 text-xs mt-1">Allow customers to place orders</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className={label}>Opens At (Optional)</span>
              <input type="time" className={field} value={f.opens_at} onChange={e => setF({...f, opens_at: e.target.value})} />
            </div>
            <div>
              <span className={label}>Closes At (Optional)</span>
              <input type="time" className={field} value={f.closes_at} onChange={e => setF({...f, closes_at: e.target.value})} />
            </div>
          </div>

          <div>
            <span className={label}>Serving Locations (Campuses) <span className="text-red-500">*</span></span>
            <div className="flex flex-wrap gap-2">
              {CAMPUSES.map(c => {
                const on = f.campus.includes(c.id);
                return (
                  <button
                    key={c.id} type="button"
                    onClick={() => setF({...f, campus: on ? f.campus.filter(x => x !== c.id) : [...f.campus, c.id]})}
                    className={`px-4 py-2 border-4 border-black font-black uppercase text-sm transition-all ${on ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0_0_#000]' : 'bg-white'}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button disabled={saving} className="bg-emerald-400 text-black border-4 border-black py-4 font-black uppercase text-xl flex items-center justify-center gap-2 hover:-translate-y-1 shadow-[4px_4px_0_0_#000] transition-all disabled:opacity-50 mt-4">
            <Save /> Save Settings
          </button>
        </form>
      )}
    </div>
  );
}
