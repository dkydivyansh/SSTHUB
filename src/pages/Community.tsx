import { Compass, Search, Share2, Lock, ArrowRight, UserPlus, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Community() {
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // URL Params & View State
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  const [viewGroup, setViewGroup] = useState<any>(null);
  const [viewGroupError, setViewGroupError] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'info'|'error'}>({show: false, msg: '', type: 'info'});
  const showToast = (msg: string, type: 'info'|'error' = 'info') => {
    setToast({show: true, msg, type});
    setTimeout(() => setToast(t => ({...t, show: false})), 3000);
  };
  
  // Discover Modal State
  const [showDiscover, setShowDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchJoinedGroups = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch('/api/community?action=joined_groups');
      const json = await res.json();
      if (json.status === 'success') {
        setJoinedGroups(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const pollData = async () => {
      if (isFetching || !isMounted) return;
      isFetching = true;
      try {
        await fetchJoinedGroups(false);
      } finally {
        isFetching = false;
        if (isMounted) {
          setTimeout(pollData, 5000);
        }
      }
    };

    // Initial fetch with loader
    fetchJoinedGroups(true).then(() => {
      if (isMounted) {
        setTimeout(pollData, 5000);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchJoinedGroups]);

  useEffect(() => {
    if (viewId) {
      setLoadingView(true);
      setViewGroupError(null);
      fetch(`/api/community?action=search_groups&query=${viewId}`)
        .then(res => res.json())
        .then(json => {
          if (json.status === 'success' && json.data.length > 0) {
            const exact = json.data.find((g:any) => g.id.toString() === viewId.toString());
            if (exact) {
              setViewGroup(exact);
            } else {
              setViewGroupError('Group not found or invalid.');
            }
          } else {
            setViewGroupError('Group not found or invalid.');
          }
        })
        .catch(() => setViewGroupError('Error fetching group details.'))
        .finally(() => setLoadingView(false));
    } else {
      setViewGroup(null);
      setViewGroupError(null);
    }
  }, [viewId]);

  // Debounced Search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/community?action=search_groups&query=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.status === 'success') {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleJoin = async (groupId: string) => {
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_group', group_id: groupId })
      });
      const json = await res.json();
      if (json.status === 'success') {
        fetchJoinedGroups();
        setShowDiscover(false);
        setSearchQuery('');
        showToast('Successfully joined group!', 'info');
        if (viewGroup && viewGroup.id === groupId) {
          setViewGroup({...viewGroup, is_member: true});
        }
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to join group.', 'error');
    }
  };

  const handleShare = async (groupId: string) => {
    const url = `${window.location.origin}/dash/community?view=${groupId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('Link copied to clipboard!');
        } catch (err) {
          showToast('Failed to copy link.', 'error');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to copy link.', 'error');
    }
  };

  const closeView = () => {
    setViewGroup(null);
    setViewGroupError(null);
    searchParams.delete('view');
    setSearchParams(searchParams);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto min-h-[80vh] relative pb-20 p-4 md:p-8">
      
      {/* Joined Groups List */}
      <div className="flex flex-col w-full">
        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6">Your Groups</h2>
        
        {loading ? (
          <div className="font-bold text-center p-8 bg-white border-4 border-black uppercase tracking-widest animate-pulse">
            Loading Groups...
          </div>
        ) : joinedGroups.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-4 p-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold text-lg">You haven't joined any groups yet.</p>
            <button 
              onClick={() => setShowDiscover(true)}
              className="bg-emerald-500 text-white border-4 border-black py-3 px-8 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
            >
              <Search size={20} /> Start Discovering
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
            {joinedGroups.map(g => (
              <button 
                key={g.id} 
                onClick={() => navigate(`/dash/community/${g.id}`)}
                className="bg-white border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-all flex flex-col gap-3 md:gap-4 text-left w-full relative"
              >
                {g.total_unread > 0 && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs md:text-sm font-black w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-4 border-black z-10 animate-bounce">
                    {g.total_unread > 99 ? '99+' : g.total_unread}
                  </div>
                )}
                <div className="flex items-center gap-4 w-full">
                  {g.logo ? (
                    <img src={g.logo} alt="Logo" className="w-14 h-14 md:w-16 md:h-16 border-4 border-black object-cover bg-white shrink-0" />
                  ) : (
                    <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-black bg-blue-100 flex items-center justify-center font-black text-blue-800 text-xl md:text-2xl shrink-0">
                      {g.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-lg md:text-xl font-black uppercase leading-tight truncate">{g.name}</h3>
                    <span className={`px-2 py-1 text-[10px] md:text-[10px] font-black uppercase tracking-widest border-2 border-black mt-1 inline-block ${g.type === 'private' ? 'bg-purple-500 text-white' : 'bg-emerald-300 text-black'}`}>
                      {g.type}
                    </span>
                  </div>
                </div>
                {g.description && <p className="font-bold text-sm text-gray-700 line-clamp-2 md:line-clamp-3">{g.description}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discover Button at Bottom */}
      {joinedGroups.length > 0 && (
        <div className="mt-12 text-center border-t-4 border-black pt-8 w-full">
          <button 
            onClick={() => setShowDiscover(true)}
            className="bg-[#3B82F6] text-white border-4 border-black py-4 px-10 text-xl font-black uppercase tracking-widest hover:-translate-y-1 hover:-rotate-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 w-full md:w-auto md:mx-auto"
          >
            <Search size={24} /> Discover More Groups
          </button>
        </div>
      )}

      {/* Discover Modal */}
      {showDiscover && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#FFF5E1] md:border-4 border-black md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full h-full md:h-[85vh] flex flex-col overflow-hidden relative">
            
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Compass size={24} /> Discover Groups
              </h2>
              <button 
                onClick={() => { setShowDiscover(false); setSearchQuery(''); }}
                className="font-black uppercase text-sm hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={20} className="md:hidden" />
                <span className="hidden md:inline">[ CLOSE ]</span>
              </button>
            </div>

            <div className="p-4 md:p-6 shrink-0 bg-white border-b-4 border-black relative">
              <Search className="absolute left-7 md:left-10 top-1/2 -translate-y-1/2 text-black w-5 h-5 md:w-6 md:h-6" />
              <input 
                type="text" 
                placeholder="Search by Group Name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f4f4f5] border-4 border-black p-3 md:p-4 pl-10 md:pl-14 text-sm md:text-lg font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6">
              {searchQuery === '' ? (
                <div className="text-center font-black uppercase text-gray-400 tracking-widest mt-10">
                  <Compass size={64} className="mx-auto mb-4 opacity-50" />
                  Type to search for groups
                </div>
              ) : searching ? (
                <div className="text-center font-black uppercase tracking-widest animate-pulse mt-10">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center font-black uppercase tracking-widest text-red-500 mt-10">
                  No groups found
                </div>
              ) : (
                searchResults.map(g => (
                  <div key={g.id} className="bg-white border-4 border-black p-4 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 md:gap-4">
                      {g.logo ? (
                        <img src={g.logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 border-4 border-black object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black bg-[#f4f4f5] flex items-center justify-center font-black shrink-0 text-xl md:text-2xl">
                          {g.name.charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg md:text-xl font-black uppercase leading-tight truncate">{g.name}</h3>
                          {g.type === 'private' && <Lock size={16} className="text-purple-600 shrink-0" />}
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {g.id}</div>
                      </div>
                    </div>

                    {g.description && <p className="font-bold text-sm text-gray-700 line-clamp-2">{g.description}</p>}

                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      {g.is_member ? (
                        <button disabled className="bg-gray-300 text-black border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs opacity-80 cursor-not-allowed flex-1">
                          Joined
                        </button>
                      ) : g.type === 'private' ? (
                        <div className="bg-purple-100 text-purple-800 border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs text-center flex items-center justify-center gap-1 flex-1">
                          <Lock size={14} /> Invite Only
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleJoin(g.id)}
                          className="bg-[#3B82F6] text-white border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1 flex-1"
                        >
                          <UserPlus size={14} /> Join
                        </button>
                      )}
                      
                      {g.type === 'public' && (
                        <button 
                          onClick={() => handleShare(g.id)}
                          className="bg-white text-black border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1 flex-1"
                        >
                          <Share2 size={14} /> Share
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 whitespace-nowrap ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#3B82F6] text-white'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Group Details Modal */}
      {viewGroup && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#FFF5E1] md:border-4 border-black md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full h-full md:h-[85vh] flex flex-col overflow-hidden relative">
            
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-2 truncate">
                <Compass size={24} className="hidden md:block shrink-0" />
                {viewGroup.name}
              </h2>
              <button 
                onClick={closeView}
                className="font-black uppercase text-sm hover:text-red-400 transition-colors flex items-center gap-1 shrink-0"
              >
                <ArrowLeft size={20} className="md:hidden" />
                <span className="hidden md:inline">[ CLOSE ]</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 text-center sm:text-left bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {viewGroup.logo ? (
                  <img src={viewGroup.logo} alt="Logo" className="w-20 h-20 md:w-32 md:h-32 border-4 border-black object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 border-4 border-black bg-[#f4f4f5] flex items-center justify-center font-black shrink-0 text-3xl md:text-5xl">
                    {viewGroup.name.charAt(0)}
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-xl md:text-3xl font-black uppercase leading-tight">{viewGroup.name}</h3>
                  <div className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {viewGroup.id}</div>
                  <span className={`px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest border-4 border-black mt-4 inline-block ${viewGroup.type === 'private' ? 'bg-purple-500 text-white' : 'bg-emerald-300 text-black'}`}>
                    {viewGroup.type}
                  </span>
                </div>
              </div>

              {viewGroup.description && (
                <div className="bg-white border-4 border-black p-4 md:p-6 font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs md:text-sm font-black uppercase text-gray-500 mb-2 tracking-widest">Description</h4>
                  <p className="whitespace-pre-wrap text-sm md:text-base">{viewGroup.description}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-4">
                {!viewGroup.is_member && viewGroup.type === 'private' ? (
                  <div className="bg-purple-100 text-purple-800 border-4 border-black py-4 font-black uppercase tracking-widest text-lg text-center flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Lock size={20} /> Invite Only
                  </div>
                ) : !viewGroup.is_member && viewGroup.type === 'public' ? (
                  <button 
                    onClick={() => handleJoin(viewGroup.id)}
                    className="bg-[#3B82F6] text-white border-4 border-black py-4 font-black uppercase tracking-widest text-lg hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus /> Join Group
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(`/dash/community/${viewGroup.id}`)}
                    className="bg-emerald-500 text-black border-4 border-black py-4 font-black uppercase tracking-widest text-lg hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <Compass /> Open Group
                  </button>
                )}
                
                {viewGroup.type === 'public' && (
                  <button 
                    onClick={() => handleShare(viewGroup.id)}
                    className="bg-white text-black border-4 border-black py-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} /> Share Link
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View Group Error Modal */}
      {viewGroupError && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-8 text-center max-w-sm w-full flex flex-col gap-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter">Error</h2>
            <p className="font-bold text-lg">{viewGroupError}</p>
            <button 
              onClick={closeView}
              className="bg-black text-white py-4 border-4 border-black font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
