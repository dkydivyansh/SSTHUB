import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X, Loader2, Calendar, Clock, BookOpen, ClipboardCheck, FileText, StickyNote } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function Dashboard() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

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
    interests: [] as string[],
    papers: [] as {title: string, link: string}[]
  });
  const [interestInput, setInterestInput] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [paperLink, setPaperLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Feed State
  const [feedData, setFeedData] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedOffset, setFeedOffset] = useState(0);

  useEffect(() => {
    document.title = 'Dashboard - SST Hub';
    fetchFeed(0);
    const interval = setInterval(() => {
      fetchFeedBackground();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeedBackground = async () => {
    try {
      const res = await fetch(`/api/dashboard_feed?offset=0`);
      const json = await res.json();
      if (json.status === 'success') {
        setFeedData(prev => {
          if (prev.length <= 20) return json.data || [];
          
          const existingIds = new Set(prev.map(p => `${p.post_type}-${p.id}`));
          const newItems = (json.data || []).filter((p: any) => !existingIds.has(`${p.post_type}-${p.id}`));
          return [...newItems, ...prev];
        });
      }
    } catch (err) {
      // silently ignore background fetch errors
    }
  };

  const fetchFeed = async (offset: number) => {
    if (offset === 0) setFeedLoading(true);
    try {
      const res = await fetch(`/api/dashboard_feed?offset=${offset}`);
      const json = await res.json();
      if (json.status === 'success') {
        if (offset === 0) {
          setFeedData(json.data || []);
        } else {
          setFeedData(prev => [...prev, ...(json.data || [])]);
        }
        setFeedHasMore((json.data || []).length === 20);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (offset === 0) setFeedLoading(false);
    }
  };

  const loadMore = () => {
    const nextOffset = feedOffset + 20;
    setFeedOffset(nextOffset);
    fetchFeed(nextOffset);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = interestInput.trim();
      if (val && formData.interests.length < 15 && !formData.interests.includes(val)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      setInterestInput('');
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

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowModal(false);
        window.location.reload();
      } else {
        setError(json.message || 'An error occurred during onboarding.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center min-h-[60vh] relative">

      {userData.status === 'pending' && (
        <div className="w-full mb-8 bg-[#3B82F6] text-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Complete Your Profile</h2>
            <p className="font-bold text-white/90">Complete your profile to access features and browse the SST directory.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 bg-black text-white font-black uppercase tracking-widest px-6 py-3 border-4 border-black hover:bg-white hover:text-black transition-colors"
          >
            Start Now
          </button>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-4">
        {[
          { icon: Calendar, label: 'Academic Calendar' },
          { icon: Clock, label: 'Weekly Schedule' },
          { icon: BookOpen, label: 'Syllabus' },
          { icon: ClipboardCheck, label: 'Attendance' },
          { icon: FileText, label: 'Assignments' },
          { icon: StickyNote, label: 'Notes' }
        ].map((btn, i) => (
          <button 
            key={i}
            disabled
            className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-gray-100 border-4 border-black p-3 sm:p-6 opacity-60 cursor-not-allowed hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-400 text-black text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-1 sm:px-2 py-0.5 sm:py-1 border-2 border-black">
              SOON
            </div>
            <btn.icon className="text-black w-6 h-6 sm:w-8 sm:h-8 mb-1" />
            <span className="font-black uppercase tracking-widest text-black text-center text-[10px] sm:text-xs">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Activity Feed */}
      <div className="w-full flex-1 max-w-4xl mx-auto flex flex-col gap-6 mt-8">
        <h2 className="text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-4 mb-4">
          Latest Activity
        </h2>
        
        {feedLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={48} className="animate-spin text-black" />
          </div>
        ) : feedData.length === 0 ? (
          <div className="w-full bg-white border-4 border-black p-12 lg:p-24 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
            <div className="absolute top-4 left-4 w-4 h-4 bg-[#3B82F6] border-2 border-black rounded-full animate-ping"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-black border-2 border-black rounded-none"></div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
              NO <span className="text-[#3B82F6]">ACTIVITY</span> YET
            </h1>

            <p className="text-lg font-bold uppercase tracking-widest text-black/60 mt-8 border-t-4 border-black pt-8">
              Join some groups in the Community tab to see their latest announcements and events here!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {feedData.map((item, index) => (
              <PostCard 
                key={`${item.post_type}-${item.id}-${index}`} 
                item={item} 
                isDashboard={true} 
              />
            ))}
            
            {feedHasMore && (
              <button
                onClick={loadMore}
                className="bg-white border-4 border-black p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-black border-4 border-black w-full max-w-2xl shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] relative flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-black/50 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-[#3B82F6]">
                    Step {step} of {totalSteps}
                  </h2>
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-2 flex-1 border-2 border-black ${i <= step ? 'bg-[#3B82F6]' : 'bg-[#E5E7EB]'}`} />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 bg-[#3B82F6] text-white p-4 font-bold border-4 border-black text-center uppercase tracking-wider text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="flex flex-col gap-6">

                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                      <h3 className="text-xl font-bold uppercase tracking-widest text-black">Basics</h3>
                      
                      <div className="flex flex-col gap-2">
                        <label className="font-black uppercase tracking-widest text-sm text-black/80">Select Your Group *</label>
                        <select
                          name="group"
                          value={formData.group}
                          onChange={handleChange}
                          className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors cursor-pointer appearance-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          required
                        >
                          <option value="A">Group A</option>
                          <option value="B">Group B</option>
                          <option value="C">Group C</option>
                          <option value="D">Group D</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-black uppercase tracking-widest text-sm text-black/80">Profile Description (Bio)</label>
                        <textarea
                          name="description"
                          placeholder="Tell us a bit about yourself... (max 50 words)"
                          value={formData.description}
                          onChange={handleChange}
                          maxLength={300}
                          rows={3}
                          className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <label className="font-black uppercase tracking-widest text-sm text-black/80">Interests & Keywords (Press Enter)</label>
                        <input
                          type="text"
                          placeholder="backend development, music..."
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          onKeyDown={handleInterestKeyDown}
                          className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                      </div>
                      
                      {formData.interests.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-1">
                          {formData.interests.map((interest, idx) => (
                            <div key={idx} className="group flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-black font-black tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => removeInterest(idx)}>
                              <span className="uppercase">{interest}</span>
                              <X size={14} className="text-white/50 group-hover:text-red-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                      <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-black">Social Profiles</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">GitHub</label>
                          <input
                            type="text"
                            name="github"
                            placeholder="username"
                            pattern="^[a-zA-Z0-9-]+$"
                            title="GitHub username only (no URLs)"
                            value={formData.github}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">Portfolio</label>
                          <input
                            type="text"
                            name="portfolio"
                            placeholder="yourdomain.com"
                            value={formData.portfolio}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">LinkedIn</label>
                          <input
                            type="text"
                            name="linkedin"
                            placeholder="username"
                            pattern="^[^/:\s]+$"
                            title="LinkedIn username only (no URLs)"
                            value={formData.linkedin}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">Instagram</label>
                          <input
                            type="text"
                            name="instagram"
                            placeholder="username"
                            pattern="^[^/:\s]+$"
                            title="Instagram username only (no URLs)"
                            value={formData.instagram}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                      <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-black">Tech & Research</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-[#3B82F6]">NlogN (CP Club)</label>
                          <input
                            type="text"
                            name="nlogn_username"
                            placeholder="Codeforces handle"
                            pattern="^[^/:\s]+$"
                            title="Username only (no URLs)"
                            value={formData.nlogn_username}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-[#3B82F6] p-4 font-bold outline-none focus:border-black transition-colors shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">HackerOne</label>
                          <input
                            type="text"
                            name="hackerone"
                            placeholder="username"
                            pattern="^[^/:\s]+$"
                            title="Username only (no URLs)"
                            value={formData.hackerone}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">ORCID</label>
                          <input
                            type="text"
                            name="orcid"
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            pattern="^[^/:\s]+$"
                            title="ORCID ID only (no URLs)"
                            value={formData.orcid}
                            onChange={handleChange}
                            className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="font-black uppercase tracking-widest text-sm text-black/80">Research Papers</label>
                          <span className="text-xs font-bold text-black/50">{formData.papers.length}/5 added</span>
                        </div>
                        {formData.papers.length < 5 && (
                          <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="flex flex-col gap-2 w-full sm:w-1/2">
                              <label className="font-black uppercase tracking-widest text-xs text-black/80">Paper Title</label>
                              <input
                                type="text"
                                placeholder="Paper Title"
                                value={paperTitle}
                                onChange={(e) => setPaperTitle(e.target.value)}
                                className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              />
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-1/2">
                              <label className="font-black uppercase tracking-widest text-xs text-black/80">Link</label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={paperLink}
                                onChange={(e) => setPaperLink(e.target.value)}
                                className="bg-white text-black border-4 border-black p-4 font-bold outline-none focus:border-[#3B82F6] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addPaper}
                              disabled={!paperTitle.trim()}
                              className="bg-black text-white font-black uppercase tracking-widest p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Add
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
                    </motion.div>
                  )}

                  <div className="flex justify-between items-center mt-8 pt-6 border-t-4 border-black/10">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="font-black text-black uppercase tracking-widest flex items-center gap-2 hover:text-[#3B82F6] transition-colors"
                      >
                        <ArrowLeft size={20} /> Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-black text-white font-black uppercase tracking-widest border-4 border-black px-8 py-3 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {step === totalSteps ? (loading ? 'Saving...' : 'Finish') : 'Next'}
                      {step < totalSteps && <ArrowRight size={20} />}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
