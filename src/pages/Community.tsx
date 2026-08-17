import { Globe, Search, Share2, Lock, ArrowRight, UserPlus, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function Community() {
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Discover Modal State
  const [showDiscover, setShowDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchJoinedGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community?action=joined_groups');
      const json = await res.json();
      if (json.status === 'success') {
        setJoinedGroups(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoinedGroups();
  }, [fetchJoinedGroups]);

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
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (groupId: string) => {
    navigator.clipboard.writeText(groupId);
    alert('Group ID copied to clipboard: ' + groupId);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto min-h-[80vh] relative pb-20">
      <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#3B82F6] text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <Globe size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Community</h1>
        </div>

        {/* Joined Groups List */}
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Your Groups</h2>
          
          {loading ? (
            <div className="font-bold text-center p-8 bg-[#f4f4f5] border-4 border-black uppercase tracking-widest animate-pulse">
              Loading Groups...
            </div>
          ) : joinedGroups.length === 0 ? (
            <div className="text-center flex flex-col items-center gap-4 p-8 bg-[#FFF5E1] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-bold text-lg">You haven't joined any groups yet.</p>
              <button 
                onClick={() => setShowDiscover(true)}
                className="bg-emerald-500 text-white border-4 border-black py-3 px-8 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                <Search size={20} /> Start Discovering
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {joinedGroups.map(g => (
                <div key={g.id} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {g.logo ? (
                      <img src={g.logo} alt="Logo" className="w-16 h-16 border-4 border-black object-cover bg-white shrink-0" />
                    ) : (
                      <div className="w-16 h-16 border-4 border-black bg-blue-100 flex items-center justify-center font-black text-blue-800 text-2xl shrink-0">
                        {g.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-xl font-black uppercase leading-tight truncate">{g.name}</h3>
                      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black mt-1 inline-block ${g.type === 'private' ? 'bg-purple-500 text-white' : 'bg-emerald-300 text-black'}`}>
                        {g.type}
                      </span>
                    </div>
                  </div>
                  {g.description && <p className="font-bold text-sm text-gray-700 line-clamp-3">{g.description}</p>}
                  <button className="mt-auto bg-black text-white border-4 border-black py-3 font-black uppercase tracking-widest hover:bg-[#3B82F6] transition-colors flex items-center justify-center gap-2">
                    Open <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discover Button at Bottom */}
        {joinedGroups.length > 0 && (
          <div className="mt-12 text-center border-t-4 border-black pt-8">
            <button 
              onClick={() => setShowDiscover(true)}
              className="bg-[#3B82F6] text-white border-4 border-black py-4 px-10 text-xl font-black uppercase tracking-widest hover:-translate-y-1 hover:-rotate-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 mx-auto"
            >
              <Search size={24} /> Discover More Groups
            </button>
          </div>
        )}
      </div>

      {/* Discover Modal */}
      {showDiscover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#FFF5E1] md:border-4 border-black md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full h-full md:h-[85vh] flex flex-col overflow-hidden relative">
            
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Globe size={24} /> Discover Groups
              </h2>
              <button 
                onClick={() => { setShowDiscover(false); setSearchQuery(''); }}
                className="font-black uppercase text-sm hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={20} className="md:hidden" />
                <span className="hidden md:inline">[ CLOSE ]</span>
              </button>
            </div>

            <div className="p-6 shrink-0 bg-white border-b-4 border-black relative">
              <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-black" size={24} />
              <input 
                type="text" 
                placeholder="Search by Group Name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f4f4f5] border-4 border-black p-4 pl-14 text-lg font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {searchQuery === '' ? (
                <div className="text-center font-black uppercase text-gray-400 tracking-widest mt-10">
                  <Globe size={64} className="mx-auto mb-4 opacity-50" />
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
                  <div key={g.id} className="bg-white border-4 border-black p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {g.logo ? (
                      <img src={g.logo} alt="Logo" className="w-16 h-16 border-4 border-black object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 border-4 border-black bg-[#f4f4f5] flex flex-col items-center justify-center font-black shrink-0 text-xl">
                        {g.name.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black uppercase leading-none">{g.name}</h3>
                        {g.type === 'private' && <Lock size={16} className="text-purple-600" />}
                      </div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {g.id}</div>
                      {g.description && <p className="font-bold text-sm text-gray-700 mt-2 line-clamp-2">{g.description}</p>}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      {g.is_member ? (
                        <button disabled className="bg-gray-300 text-black border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs opacity-80 cursor-not-allowed">
                          Joined
                        </button>
                      ) : g.type === 'private' ? (
                        <div className="bg-purple-100 text-purple-800 border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs text-center flex items-center justify-center gap-1">
                          <Lock size={14} /> Invite Only
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleJoin(g.id)}
                          className="bg-[#3B82F6] text-white border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1"
                        >
                          <UserPlus size={14} /> Join
                        </button>
                      )}
                      
                      {g.type === 'public' && (
                        <button 
                          onClick={() => handleShare(g.id)}
                          className="bg-white text-black border-4 border-black py-2 px-4 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1"
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

    </div>
  );
}
