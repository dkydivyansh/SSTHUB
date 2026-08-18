import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Clock, Plus, X, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function GroupPage() {
  const { groupId, tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'announcements';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'announcement' | 'event'>('announcement');
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/group_data?group_id=${groupId}`);
        if (res.status === 401 || res.status === 403) {
          setError('Not authorized to view this group');
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (json.status === 'success') {
          setData(json.data);
          setGroupInfo(json.group);
        } else {
          setError(json.message || 'Error fetching group');
        }
      } catch (err) {
        setError('Failed to fetch group data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full min-h-[60vh] relative">
        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center min-h-[400px] flex-1">
          <h2 className="text-2xl font-black uppercase animate-pulse">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full min-h-[60vh] relative">
        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px] p-6 text-center flex-1">
          <Lock size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl md:text-3xl font-black uppercase text-black tracking-widest">{error}</h2>
          <p className="font-bold text-gray-500 mt-2">You must join this group before you can see its content.</p>
          <button 
            onClick={() => navigate('/dash/community')}
            className="mt-6 bg-black text-white px-6 py-3 font-black uppercase text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Community
          </button>
        </div>
      </div>
    );
  }

  const announcements = data.filter(item => item.post_type === 'announcement');
  const events = data.filter(item => item.post_type === 'event');

  const handleAddClick = (type: 'announcement' | 'event') => {
    if (isMobile) {
      navigate(`/dash/community/${groupId}/create?type=${type}`);
    } else {
      setModalType(type);
      setShowModal(true);
      setModalTitle('');
      setModalContent('');
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(false);
    }, 1000);
  };

  const renderPost = (item: any) => {
    let ctx: any = {};
    let extras: any = {};
    try {
      ctx = typeof item.context === 'string' ? JSON.parse(item.context) : (item.context || {});
      extras = typeof item.extras === 'string' ? JSON.parse(item.extras) : (item.extras || {});
    } catch(e) {}
    
    let content = ctx.content || '';
    if (content) {
      try {
        content = atob(content);
      } catch(e) {
        // If not base64 encoded, just use as is
      }
    }

    return (
      <div key={item.id} className="border-4 border-black p-4 bg-[#f4f4f5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
        {ctx.title && <h3 className="font-black text-xl uppercase tracking-tighter">{ctx.title}</h3>}
        
        {item.post_type === 'event' && (
          <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest border-2 border-black p-2 bg-white self-start">
            {ctx.type === 'offline' ? (
              <span className="flex items-center gap-1 text-orange-500"><MapPin size={14} /> Offline</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500"><MapPin size={14} /> Virtual</span>
            )}
            {ctx.time && <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(ctx.time).toLocaleString()}</span>}
          </div>
        )}

        {content && (
          <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:uppercase font-bold">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {ctx.tags && Array.isArray(ctx.tags) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {ctx.tags.map((tag: string, i: number) => (
              <span key={i} className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1">#{tag}</span>
            ))}
          </div>
        )}

        {extras && Object.keys(extras).length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t-2 border-black border-dashed">
            {Object.entries(extras).map(([label, link], i) => (
              <a key={i} href={link as string} target="_blank" rel="noreferrer" className="bg-[#3B82F6] text-white px-4 py-2 font-black text-xs uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full min-h-[60vh] relative bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      
      {/* Top Banner (Header) */}
      <div className="p-4 md:p-8 border-b-4 border-black flex items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-4 truncate">
          {groupInfo?.logo && (
            <img src={groupInfo.logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 border-2 border-black object-cover bg-white shrink-0" />
          )}
          <div className="truncate">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter truncate">{groupInfo?.name || `Group ${groupId}`}</h1>
            <p className="font-bold text-xs md:text-sm text-gray-500 uppercase tracking-widest mt-1">
              {activeTab === 'announcements' ? 'Announcements' : activeTab === 'events' ? 'Events' : 'About Group'}
            </p>
          </div>
        </div>
        {groupInfo?.is_admin && activeTab !== 'about' && (
          <button onClick={() => handleAddClick(activeTab as any)} className="shrink-0 bg-black text-white p-2 md:px-4 md:py-3 font-black uppercase tracking-widest text-[10px] md:text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
            <Plus size={16} /> <span className="hidden md:inline">Add {activeTab === 'events' ? 'Event' : 'Post'}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white flex flex-col gap-6 relative min-h-[400px]">
        {activeTab === 'announcements' && (
          <div className="flex flex-col gap-4">
            {announcements.length === 0 ? (
              <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">No announcements yet.</div>
            ) : (
              announcements.map(item => renderPost(item))
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="flex flex-col gap-4">
            {events.length === 0 ? (
              <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">No events yet.</div>
            ) : (
              events.map(item => renderPost(item))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#f4f4f5] border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase tracking-widest mb-4">Description</h3>
              <p className="font-bold text-gray-700 whitespace-pre-wrap">{groupInfo?.description || 'No description provided.'}</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 inline-flex self-start">
              <div className="bg-emerald-500 p-2 border-2 border-black">
                <Clock className="text-black" size={24} />
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-gray-500">Joined Group On</p>
                <p className="font-black text-lg">{groupInfo?.joined_at ? new Date(groupInfo.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#f4f4f5]">
              <h2 className="font-black uppercase tracking-tighter text-xl">New {modalType}</h2>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleModalSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">Title</label>
                  <input required value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} className="border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" placeholder={`Enter ${modalType} title...`} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">Content (Markdown)</label>
                  <textarea required value={modalContent} onChange={(e) => setModalContent(e.target.value)} className="border-4 border-black p-3 font-bold min-h-[200px] resize-y focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" placeholder="Write your post in Markdown..." />
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#3B82F6] text-white p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-4 border-black mt-2">
                  {isSubmitting ? 'Posting...' : 'Post to Group'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
