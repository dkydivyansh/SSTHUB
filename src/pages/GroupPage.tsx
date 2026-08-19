import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Clock, Plus, X, Pencil, Eye, Trash2, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';

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
  
  // Modal State
  const [modalType, setModalType] = useState<'announcement' | 'event'>('announcement');
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [tags, setTags] = useState('');
  const [eventType, setEventType] = useState<'virtual' | 'offline'>('virtual');
  const [eventTime, setEventTime] = useState('');
  const [address, setAddress] = useState('');
  const [rsvpLink, setRsvpLink] = useState('');
  const [buttons, setButtons] = useState<{ label: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Desktop search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const pollData = async () => {
      if (isFetching || !isMounted) return;
      isFetching = true;
      try {
        await fetchData();
      } finally {
        isFetching = false;
        if (isMounted) {
          setTimeout(pollData, 5000);
        }
      }
    };

    pollData();

    return () => {
      isMounted = false;
    };
  }, [groupId, navigate]);

  // Desktop search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchPage(1);
      return;
    }
    setIsSearching(true);
    setSearchLoading(true);
    const typeParam = activeTab === 'events' ? 'event' : activeTab === 'announcements' ? 'announcement' : '';
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search_posts?group_id=${groupId}&q=${encodeURIComponent(searchQuery.trim())}&type=${typeParam}&page=1&limit=20`);
        const json = await res.json();
        if (json.status === 'success') {
          setSearchResults(json.data);
          setSearchHasMore(json.has_more);
          setSearchPage(1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, groupId, activeTab]);

  const loadMoreSearch = async () => {
    const nextPage = searchPage + 1;
    setSearchLoading(true);
    const typeParam = activeTab === 'events' ? 'event' : activeTab === 'announcements' ? 'announcement' : '';
    try {
      const res = await fetch(`/api/search_posts?group_id=${groupId}&q=${encodeURIComponent(searchQuery.trim())}&type=${typeParam}&page=${nextPage}&limit=20`);
      const json = await res.json();
      if (json.status === 'success') {
        setSearchResults(prev => [...prev, ...json.data]);
        setSearchHasMore(json.has_more);
        setSearchPage(nextPage);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };


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

  const handleAddClick = (rawType: string) => {
    const type = rawType.endsWith('s') ? rawType.slice(0, -1) as 'announcement' | 'event' : rawType as 'announcement' | 'event';
    if (isMobile) {
      navigate(`/dash/community/${groupId}/create?type=${type}`);
    } else {
      setModalType(type);
      setModalTitle('');
      setModalContent('');
      setTags('');
      setEventType('virtual');
      setEventTime('');
      setAddress('');
      setRsvpLink('');
      setButtons([]);
      setModalError('');
      setPreviewMode(false);
      setShowModal(true);
    }
  };

  const addButton = () => setButtons([...buttons, { label: '', url: '' }]);
  const removeButton = (idx: number) => setButtons(buttons.filter((_, i) => i !== idx));
  const updateButton = (idx: number, field: 'label' | 'url', value: string) => {
    const updated = [...buttons];
    updated[idx][field] = value;
    setButtons(updated);
  };

  const buildPreviewItem = () => {
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const buttonsObj: Record<string, string> = {};
    buttons.forEach(b => { if (b.label && b.url) buttonsObj[b.label] = b.url; });

    const ctx: any = {
      title: modalTitle || 'Untitled',
      content: modalContent || '',
      tags: tagsArray
    };
    if (modalType === 'event') {
      ctx.type = eventType;
      ctx.time = eventTime || null;
      if (eventType === 'offline' && address) {
        buttonsObj['address'] = address;
      }
      if (rsvpLink) {
        buttonsObj['RSVP'] = rsvpLink;
      }
    }

    return {
      id: 0,
      post_type: modalType,
      context: ctx,
      extras: Object.keys(buttonsObj).length > 0 ? buttonsObj : null,
      created_at: new Date().toISOString()
    };
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    const tagsStr = tags;
    const buttonsObj: Record<string, string> = {};
    buttons.forEach(b => { if (b.label && b.url) buttonsObj[b.label] = b.url; });

    try {
      const res = await fetch('/api/add_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          post_type: modalType,
          title: modalTitle,
          content: modalContent,
          tags: tagsStr,
          event_type: modalType === 'event' ? eventType : undefined,
          event_time: modalType === 'event' ? eventTime : undefined,
          address: modalType === 'event' && eventType === 'offline' ? address : undefined,
          rsvp_link: modalType === 'event' ? rsvpLink : undefined,
          buttons: Object.keys(buttonsObj).length > 0 ? buttonsObj : null
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setShowModal(false);
        fetchData(); // Refresh the feed
      } else {
        setModalError(result.message || 'Failed to create post');
      }
    } catch (err) {
      setModalError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeletePost = async (postId: number, postType: string) => {
    try {
      const res = await fetch('/api/delete_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, post_id: postId, post_type: postType })
      });
      const result = await res.json();
      if (result.status === 'success') {
        fetchData(); // Refresh the feed
        if (isSearching && searchQuery) {
          setSearchResults(prev => prev.filter(p => p.id !== postId || p.post_type !== postType));
        }
      } else {
        throw new Error(result.message || 'Failed to delete post');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Network error while deleting. Please try again.');
    }
  };

  const inputClass = "border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full";

  return (
    <div className="flex flex-col w-full min-h-[60vh] relative gap-6 md:gap-8">
      
      {/* Top Banner (Header) */}
      <div className="p-4 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 bg-white">
        <div className="flex items-center justify-between gap-4">
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
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile: search icon navigates to full page */}
            {activeTab !== 'about' && (
              <button
                onClick={() => isMobile ? navigate(`/dash/community/${groupId}/search?type=${activeTab === 'events' ? 'event' : 'announcement'}`, { state: { isAdmin: groupInfo?.is_admin } }) : setIsSearching(prev => !prev)}
                className="bg-white text-black p-2 border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Search size={16} />
              </button>
            )}
            {groupInfo?.is_admin && activeTab !== 'about' && (
              <button onClick={() => handleAddClick(activeTab as any)} className="bg-black text-white p-2 md:px-4 md:py-3 font-black uppercase tracking-widest text-[10px] md:text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                <Plus size={16} /> <span className="hidden md:inline">Add {activeTab === 'events' ? 'Event' : 'Post'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop: inline search bar */}
        {isSearching && !isMobile && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-4 border-black p-2 pl-10 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full text-sm"
              placeholder="Search announcements & events..."
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 relative min-h-[400px]">
        {/* Desktop search results overlay */}
        {isSearching && searchQuery.trim() && !isMobile ? (
          <div className="flex flex-col gap-8">
            <p className="font-black uppercase tracking-widest text-xs text-gray-500">
              Search results for "{searchQuery}"
            </p>
            {searchLoading && searchResults.length === 0 && (
              <div className="text-center p-8">
                <Loader2 size={24} className="animate-spin mx-auto" />
              </div>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">No results found.</div>
            )}
            {searchResults.map((item, i) => (
              <PostCard key={`${item.post_type}-${item.id}-${i}`} item={item} isAdmin={groupInfo?.is_admin} onDelete={handleDeletePost} />
            ))}
            {searchHasMore && (
              <button
                onClick={loadMoreSearch}
                disabled={searchLoading}
                className="bg-black text-white p-3 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black self-center disabled:opacity-50 flex items-center gap-2"
              >
                {searchLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Load More
              </button>
            )}
          </div>
        ) : (
        <>
        {activeTab === 'announcements' && (
          <div className="flex flex-col gap-8">
            {announcements.length === 0 ? (
              <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">No announcements yet.</div>
            ) : (
              announcements.map((item, i) => <PostCard key={i} item={item} isAdmin={groupInfo?.is_admin} onDelete={handleDeletePost} />)
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="flex flex-col gap-8">
            {events.length === 0 ? (
              <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">No events yet.</div>
            ) : (
              events.map((item, i) => <PostCard key={i} item={item} isAdmin={groupInfo?.is_admin} onDelete={handleDeletePost} />)
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
        </>
        )}
      </div>

      {/* Desktop Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#f4f4f5]">
              <div className="flex items-center gap-4">
                <h2 className="font-black uppercase tracking-tighter text-xl">New {modalType}</h2>
                <div className="flex gap-0 border-4 border-black">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`px-3 py-1 font-black uppercase text-[10px] tracking-widest flex items-center gap-1 transition-colors ${!previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 font-black uppercase text-[10px] tracking-widest flex items-center gap-1 transition-colors border-l-4 border-black ${previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {previewMode ? (
                <div className="flex flex-col gap-4">
                  <PostCard item={buildPreviewItem()} />
                </div>
              ) : (
                <form onSubmit={handleModalSubmit} className="flex flex-col gap-6">
                  {modalError && (
                    <div className="bg-red-500 text-white p-3 font-bold border-4 border-black text-sm">{modalError}</div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <label className="font-black uppercase tracking-widest text-xs">Title *</label>
                    <input required value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} className={inputClass} placeholder={`Enter ${modalType} title...`} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="font-black uppercase tracking-widest text-xs">Content *</label>
                    <textarea required value={modalContent} onChange={(e) => setModalContent(e.target.value)} className={`${inputClass} min-h-[160px] resize-y`} placeholder="Write your post here..." />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">*bold*, _italic_, ~strike~, `code`</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-black uppercase tracking-widest text-xs">Tags (comma-separated)</label>
                    <input value={tags} onChange={e => setTags(e.target.value)} className={inputClass} placeholder="e.g. important, deadline, exam" />
                  </div>

                  {modalType === 'event' && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="font-black uppercase tracking-widest text-xs">Event Type *</label>
                        <select value={eventType} onChange={e => setEventType(e.target.value as any)} className={`${inputClass} cursor-pointer appearance-none`}>
                          <option value="virtual">Virtual</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-black uppercase tracking-widest text-xs">Event Date & Time *</label>
                        <input required type="datetime-local" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputClass} />
                      </div>
                      {eventType === 'offline' && (
                        <div className="flex flex-col gap-2">
                          <label className="font-black uppercase tracking-widest text-xs">Address / Location *</label>
                          <input required value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Enter full address..." />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="font-black uppercase tracking-widest text-xs">RSVP Link (Optional)</label>
                        <input value={rsvpLink} onChange={e => setRsvpLink(e.target.value)} className={inputClass} placeholder="https://forms.gle/..." />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="font-black uppercase tracking-widest text-xs">Button Links (Optional)</label>
                      <button type="button" onClick={addButton} className="bg-black text-white p-1.5 hover:-translate-y-0.5 transition-transform">
                        <Plus size={14} />
                      </button>
                    </div>
                    {buttons.map((btn, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} className="border-4 border-black p-2 font-bold text-sm flex-1 focus:outline-none" placeholder="Label" />
                        <input value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)} className="border-4 border-black p-2 font-bold text-sm flex-[2] focus:outline-none" placeholder="https://..." />
                        <button type="button" onClick={() => removeButton(i)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="bg-[#3B82F6] text-white p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-4 border-black mt-2">
                    {isSubmitting ? 'Posting...' : 'Post to Group'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
