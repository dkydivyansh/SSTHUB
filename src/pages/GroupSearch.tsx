import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function GroupSearch() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || '';
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const observerRef = useRef<IntersectionObserver>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string, pageNum: number, append: boolean) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search_posts?group_id=${groupId}&q=${encodeURIComponent(q.trim())}&type=${typeParam}&page=${pageNum}&limit=20`);
      const json = await res.json();
      if (json.status === 'success') {
        setResults(prev => append ? [...prev, ...json.data] : json.data);
        setHasMore(json.has_more);
        setSearched(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, typeParam]);

  const handleDeletePost = async (postId: number, postType: string) => {
    try {
      const res = await fetch('/api/delete_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, post_id: postId, post_type: postType })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setResults(prev => prev.filter(p => p.id !== postId || p.post_type !== postType));
      } else {
        throw new Error(result.message || 'Failed to delete post');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Network error while deleting. Please try again.');
    }
  };

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setPage(1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(query, 1, false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || loading) return;

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        doSearch(query, nextPage, true);
      }
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [hasMore, loading, page, query, doSearch]);

  const inputClass = "border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full";

  return (
    <div className="flex flex-col w-full min-h-[60vh] gap-6">
      {/* Header */}
      <div className="p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="shrink-0 p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Search announcements & events..."
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-6">
        {loading && results.length === 0 && (
          <div className="text-center p-8">
            <Loader2 size={24} className="animate-spin mx-auto" />
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center p-8 opacity-50 font-black uppercase tracking-widest">
            No results found.
          </div>
        )}

        {results.map((item, i) => (
          <PostCard key={`${item.post_type}-${item.id}-${i}`} item={item} isAdmin={location.state?.isAdmin} onDelete={handleDeletePost} />
        ))}

        {/* Sentinel for Intersection Observer */}
        <div ref={sentinelRef} className="h-4" />

        {loading && results.length > 0 && (
          <div className="text-center p-4">
            <Loader2 size={20} className="animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
