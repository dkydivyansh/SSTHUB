import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, X, Mail, User, ShieldAlert, Award, ArrowLeft, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const getInitialState = () => {
  const saved = sessionStorage.getItem('socialDiscoverState');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
};

export default function SocialDiscover() {
  const navigate = useNavigate();
  const initialState = useRef(getInitialState());

  const [query, setQuery] = useState(initialState.current?.query || '');
  const [filters, setFilters] = useState(initialState.current?.filters || { batch: '', group: '', type: '' });
  const [results, setResults] = useState<any[]>(initialState.current?.results || []);
  const [page, setPage] = useState(initialState.current?.page || 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialState.current?.hasMore ?? true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  // Restore scroll
  useEffect(() => {
    if (initialState.current?.scrollY) {
      setTimeout(() => {
        window.scrollTo(0, initialState.current.scrollY);
      }, 100);
    }
    sessionStorage.removeItem('socialDiscoverState');
  }, []);

  const lastUserElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Reset when query or filters change
  const isInitialMountForReset = useRef(true);
  useEffect(() => {
    if (isInitialMountForReset.current) {
      isInitialMountForReset.current = false;
      return;
    }
    setResults([]);
    setPage(1);
    setHasMore(true);
  }, [query, filters]);

  // Fetch data
  const isInitialMountForFetch = useRef(true);
  useEffect(() => {
    if (isInitialMountForFetch.current) {
      isInitialMountForFetch.current = false;
      if (initialState.current) return;
    }

    if (query.trim().length < 3) {
      setResults([]);
      setHasMore(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          q: query.trim(),
          page: page.toString(),
          ...(filters.batch && { batch: filters.batch }),
          ...(filters.group && { group: filters.group }),
          ...(filters.type && { type: filters.type })
        });

        const res = await fetch(`/api/social_discover?${queryParams.toString()}`);
        const data = await res.json();

        if (data.status === 'success') {
          if (data.data.length === 0) {
            setHasMore(false);
          } else {
            setResults(prev => page === 1 ? data.data : [...prev, ...data.data]);
            setHasMore(data.data.length === 20); // Limit is 20
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search if it's the first page
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, page === 1 ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [query, filters, page]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Search */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center w-full">
            <button 
              onClick={() => navigate('/dash/social')}
              className="bg-black text-white p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50" size={24} />
              <input
                type="text"
                placeholder="Search name or roll (min 3 chars)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#f4f4f5] border-4 border-black p-4 pl-12 font-bold outline-none focus:border-[#3B82F6] transition-colors md:text-lg"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center border-t-4 border-black pt-4">
            <Filter size={20} className="text-black/50 hidden md:block shrink-0" />
            <div className="grid grid-cols-2 md:flex flex-wrap gap-4 w-full md:w-auto">
              <select
                value={filters.batch}
                onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                className="w-full md:w-auto bg-white border-4 border-black p-2 font-black uppercase tracking-widest text-sm focus:border-[#3B82F6] outline-none cursor-pointer"
              >
                <option value="">Any Batch</option>
                {Array.from({ length: (new Date().getFullYear() + 4) - 2027 + 1 }, (_, i) => 2027 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={filters.group}
                onChange={(e) => setFilters({ ...filters, group: e.target.value })}
                className="w-full md:w-auto bg-white border-4 border-black p-2 font-black uppercase tracking-widest text-sm focus:border-[#3B82F6] outline-none cursor-pointer"
              >
                <option value="">Any Group</option>
                <option value="A">Group A</option>
                <option value="B">Group B</option>
                <option value="C">Group C</option>
                <option value="D">Group D</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full md:w-auto col-span-2 md:col-span-1 bg-white border-4 border-black p-2 font-black uppercase tracking-widest text-sm focus:border-[#3B82F6] outline-none cursor-pointer"
              >
                <option value="">Any Type</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {query.length >= 3 && results.length === 0 && !loading && (
        <div className="text-center font-black uppercase tracking-widest text-xl opacity-50 py-12">
          No users found
        </div>
      )}

      {query.length < 3 && (
        <div className="text-center font-black uppercase tracking-widest text-xl opacity-50 py-12">
          Type at least 3 characters to search
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((user, index) => {
          const isLast = results.length === index + 1;
          const isFaculty = user.type === 'faculty' || user.type === 'admin';
          return (
            <div
              key={user.user_id}
              ref={isLast ? lastUserElementRef : null}
              onClick={() => setSelectedUser(user)}
              className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all cursor-pointer flex flex-col items-center p-6 text-center group"
            >
              <div className="relative mb-4">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full border-4 border-black object-cover bg-[#f4f4f5] group-hover:border-[#3B82F6] transition-colors"
                />
                {isFaculty && (
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 border-2 border-black rounded-full" title="Faculty">
                    <ShieldAlert size={16} />
                  </div>
                )}
              </div>
              <h3 className="font-black uppercase tracking-widest text-lg truncate w-full group-hover:text-[#3B82F6] transition-colors">{user.name}</h3>
              <p className="font-bold text-xs uppercase tracking-widest text-black/50 mt-1">{user.rollno || 'NO ROLL NO'}</p>
              <div className="flex items-center gap-2 mt-4 text-xs font-black uppercase tracking-widest">
                {user.batch && <span className="bg-[#f4f4f5] px-2 py-1 border-2 border-black">B{user.batch}</span>}
                {user.group && <span className="bg-[#f4f4f5] px-2 py-1 border-2 border-black">G{user.group}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center font-black uppercase tracking-widest text-xl animate-pulse py-8">
          Loading...
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 bg-black text-white p-2 border-2 border-black hover:bg-red-500 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              <img 
                src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} 
                alt={selectedUser.name} 
                className="w-32 h-32 rounded-full border-4 border-black object-cover bg-[#f4f4f5] mb-6"
              />
              <h2 className="font-black uppercase tracking-tighter text-3xl mb-2">{selectedUser.name}</h2>
              {(selectedUser.type === 'faculty' || selectedUser.type === 'admin') && (
                <div className="bg-red-500 text-white font-black uppercase tracking-widest text-xs px-3 py-1 border-2 border-black mb-2 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldAlert size={14} /> faculty
                </div>
              )}
              <p className="font-bold text-lg text-black/70 mb-6">{selectedUser.email}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-[#f4f4f5] border-4 border-black p-3">
                  <p className="font-black text-xl">{selectedUser.rollno || 'N/A'}</p>
                  <p className="font-bold text-[10px] uppercase tracking-widest text-black/50">Roll Number</p>
                </div>
                <div className="bg-[#f4f4f5] border-4 border-black p-3">
                  <p className="font-black text-xl">{selectedUser.batch ? `${selectedUser.batch}-${selectedUser.group}` : 'N/A'}</p>
                  <p className="font-bold text-[10px] uppercase tracking-widest text-black/50">Batch & Group</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full">
                <Link
                  to={selectedUser.rollno ? `/dash/social?startchat=${selectedUser.rollno}` : '#'}
                  className={`flex flex-col items-center gap-2 p-3 bg-white border-4 border-black transition-all ${!selectedUser.rollno ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <MessageSquare size={20} />
                  <span className="font-black uppercase tracking-widest text-[9px]">Message</span>
                </Link>
                <a 
                  href={`mailto:${selectedUser.email}`}
                  className="flex flex-col items-center gap-2 p-3 bg-[#3B82F6] text-white border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Mail size={20} />
                  <span className="font-black uppercase tracking-widest text-[9px]">Email</span>
                </a>
                <Link 
                  to={selectedUser.rollno ? `/u/${selectedUser.rollno}` : '#'}
                  state={{ fromDiscover: true }}
                  onClick={() => {
                    sessionStorage.setItem('socialDiscoverState', JSON.stringify({
                      query, filters, results, page, hasMore, scrollY: window.scrollY
                    }));
                  }}
                  className={`flex flex-col items-center gap-2 p-3 bg-black text-white border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all ${!selectedUser.rollno && 'pointer-events-none opacity-50'}`}
                >
                  <User size={20} />
                  <span className="font-black uppercase tracking-widest text-[9px]">View</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
