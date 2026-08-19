import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfileEdit() {
  const { userData } = useOutletContext<{ userData: any }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    group: 'A',
    description: '',
    github: '',
    portfolio: '',
    linkedin: '',
    instagram: '',
    hackerone: '',
    orcid: '',
    nlogn_username: '',
    disable_public_profile: false,
    interests: [] as string[],
    papers: [] as {title: string, link: string}[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [paperLink, setPaperLink] = useState('');

  useEffect(() => {
    if (userData) {
      let extra = { description: '', social: { github: '', portfolio: '', instagram: '', linkedin: '', hackerone: '' }, clubs: { nlogn: '' }, research: { orcid: '', papers: [] }, interests: [] };
      
      try {
        if (userData.extra) {
          const parsed = typeof userData.extra === 'string' ? JSON.parse(userData.extra) : userData.extra;
          extra = {
            description: parsed.description || '',
            social: { ...extra.social, ...parsed.social },
            clubs: { ...extra.clubs, ...parsed.clubs },
            research: { ...extra.research, ...parsed.research },
            disable_public_profile: parsed.disable_public_profile || false,
            interests: parsed.interests || []
          };
        }
      } catch (e) {
        console.error('Failed to parse extra data', e);
      }

      setFormData({
        group: userData.group || 'A',
        description: extra.description,
        github: extra.social.github,
        portfolio: extra.social.portfolio,
        linkedin: extra.social.linkedin,
        instagram: extra.social.instagram,
        hackerone: extra.social.hackerone,
        orcid: extra.research?.orcid || '',
        nlogn_username: extra.clubs?.nlogn || '',
        disable_public_profile: extra.disable_public_profile || false,
        interests: extra.interests || [],
        papers: extra.research?.papers || []
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = interestInput.trim();
      if (val && formData.interests.length < 15 && !formData.interests.includes(val)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      setInterestInput('');
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const val = value.slice(0, -1).trim();
      if (val && formData.interests.length < 15 && !formData.interests.includes(val)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      setInterestInput('');
    } else {
      setInterestInput(value);
    }
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const addPaper = () => {
    if (paperTitle.trim() && formData.papers.length < 5) {
      setFormData(prev => ({
        ...prev,
        papers: [...prev.papers, { title: paperTitle.trim(), link: paperLink.trim() }]
      }));
      setPaperTitle('');
      setPaperLink('');
    }
  };

  const removePaper = (index: number) => {
    setFormData(prev => ({
      ...prev,
      papers: prev.papers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    fetch('/api/profile_update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setSuccessMsg('Profile updated successfully!');
          setLoading(false);
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setError(data.message || 'An error occurred while updating profile.');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Network error. Please try again.');
        setLoading(false);
      });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-12"
    >
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dash/profile" className="bg-white border-4 border-black p-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-8">
        
        {/* Basics */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#3B82F6] mb-4 border-b-4 border-black pb-2">Basics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2 lg:col-span-1">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">Select Your Group *</label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors cursor-pointer appearance-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                required
              >
                <option value="A">Group A</option>
                <option value="B">Group B</option>
                <option value="C">Group C</option>
                <option value="D">Group D</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 lg:col-span-3">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">Profile Description (Bio)</label>
              <textarea
                name="description"
                placeholder="Tell us a bit about yourself... (max 50 words)"
                value={formData.description}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
              />
            </div>
          </div>
        </section>

        {/* Interests & Hobbies */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#3B82F6] mb-4 border-b-4 border-black pb-2">Interests & Hobbies</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">Add Keywords (e.g. backend development, music)</label>
              <input
                type="text"
                placeholder="Type and press Enter or comma..."
                value={interestInput}
                onChange={handleInterestChange}
                onKeyDown={handleInterestKeyDown}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            
            {formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {formData.interests.map((interest, idx) => (
                  <div key={idx} className="group flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-black font-black tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => removeInterest(idx)}>
                    <span className="uppercase">{interest}</span>
                    <X size={14} className="text-white/50 group-hover:text-red-500 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Social Profiles */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#3B82F6] mb-4 border-b-4 border-black pb-2">Social Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">GitHub</label>
              <input
                type="text"
                name="github"
                placeholder="username"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="GitHub username only (no URLs)"
                value={formData.github}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">Portfolio</label>
              <input
                type="text"
                name="portfolio"
                placeholder="yourdomain.com"
                value={formData.portfolio}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">LinkedIn</label>
              <input
                type="text"
                name="linkedin"
                placeholder="username"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="LinkedIn username only (no URLs)"
                value={formData.linkedin}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">Instagram</label>
              <input
                type="text"
                name="instagram"
                placeholder="username"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="Instagram username only (no URLs)"
                value={formData.instagram}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>
        </section>

        {/* Tech & Research */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#3B82F6] mb-4 border-b-4 border-black pb-2">Tech & Research</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">NlogN (CP Club)</label>
              <input
                type="text"
                name="nlogn_username"
                placeholder="username"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="Username only (no URLs)"
                value={formData.nlogn_username}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">HackerOne</label>
              <input
                type="text"
                name="hackerone"
                placeholder="username"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="Username only (no URLs)"
                value={formData.hackerone}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs text-black/80">ORCID</label>
              <input
                type="text"
                name="orcid"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="ORCID ID only (no URLs)"
                value={formData.orcid}
                onChange={handleChange}
                className="bg-white text-black border-4 border-black p-3 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <h3 className="font-black uppercase tracking-widest text-[#3B82F6] text-sm border-b-2 border-black pb-2">Research Papers</h3>
            
            {formData.papers.length < 5 && (
              <div className="flex flex-col sm:flex-row gap-4 items-end bg-[#FDFDFD] border-4 border-black border-dashed p-4">
                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="font-black uppercase tracking-widest text-xs text-black/80">Title *</label>
                  <input
                    type="text"
                    placeholder="Paper Title"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    className="bg-white text-black border-4 border-black p-2 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="font-black uppercase tracking-widest text-xs text-black/80">Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={paperLink}
                    onChange={(e) => setPaperLink(e.target.value)}
                    className="bg-white text-black border-4 border-black p-2 text-sm font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPaper}
                  disabled={!paperTitle.trim()}
                  className="bg-black text-white font-black uppercase tracking-widest p-2 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[44px]"
                >
                  Add Paper
                </button>
              </div>
            )}

            {formData.papers.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                {formData.papers.map((paper, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                    <div className="flex flex-col overflow-hidden mr-4">
                      <p className="font-bold text-sm truncate uppercase tracking-tight">{paper.title}</p>
                      {paper.link && <p className="text-xs text-[#3B82F6] truncate mt-1">{paper.link}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePaper(idx)}
                      className="bg-black text-white p-2 border-2 border-black hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:bg-red-500 transition-all shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-2 border-t-4 border-black pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="disable_public_profile"
                checked={formData.disable_public_profile}
                onChange={(e) => setFormData({ ...formData, disable_public_profile: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-14 h-8 border-4 border-black transition-colors ${formData.disable_public_profile ? 'bg-[#3B82F6]' : 'bg-white'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-black transition-transform ${formData.disable_public_profile ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="font-black uppercase tracking-widest text-sm text-black group-hover:text-[#3B82F6] transition-colors">
              Disable Public Profile
            </span>
          </label>

          <div className="flex flex-col items-end gap-4">
            {error && (
              <div className="bg-[#3B82F6] text-white px-4 py-2 font-bold border-4 border-black text-center uppercase tracking-wider w-full md:w-auto">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-black text-white px-4 py-2 font-bold border-4 border-black text-center uppercase tracking-wider w-full md:w-auto shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
                {successMsg}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white font-black uppercase tracking-widest border-4 border-black px-6 py-3 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base w-full md:w-auto"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
