import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X, Loader2, Calendar, Clock, BookOpen, ClipboardCheck, FileText, StickyNote, PartyPopper, ShoppingBag, Store } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function Dashboard() {
  const { userData } = useOutletContext<{ userData: any }>();

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

  return (
    <div className="w-full h-full flex flex-col items-center min-h-[60vh] relative">


      {/* Quick Links Section */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
        {(userData?.type === 'admin' || userData?.type === 'faculty') && (
          <Link 
            to="/faculty"
            className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-[#8B5CF6] text-white border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group lg:col-span-4"
          >
            <ClipboardCheck className="text-white w-6 h-6 sm:w-8 sm:h-8 mb-1" />
            <span className="font-black uppercase tracking-widest text-center text-[10px] sm:text-xs">Manage Classes (Faculty)</span>
          </Link>
        )}
        {(userData?.has_shop || userData?.type === 'admin') && (
          <Link 
            to="/shop-manage"
            className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-emerald-400 text-black border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group lg:col-span-4"
          >
            <Store className="text-black w-6 h-6 sm:w-8 sm:h-8 mb-1" />
            <span className="font-black uppercase tracking-widest text-center text-[10px] sm:text-xs">Manage Shop</span>
          </Link>
        )}
        {userData?.type === 'admin' && (
          <Link 
            to="/shop-manage/admin"
            className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-[#F43F5E] text-white border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group lg:col-span-4"
          >
            <Store className="text-white w-6 h-6 sm:w-8 sm:h-8 mb-1" />
            <span className="font-black uppercase tracking-widest text-center text-[10px] sm:text-xs">Shop Admin</span>
          </Link>
        )}
        <div className="col-span-2 sm:col-span-1 block">
          <Link 
            to="/shop"
            className="w-full h-full relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-yellow-300 border-4 border-black p-5 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group overflow-hidden"
          >
            <motion.div 
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 border-black animate-pulse z-10">🔥 LIVE</div>
            <ShoppingBag className="text-black w-8 h-8 sm:w-8 sm:h-8 mb-1 group-hover:scale-110 transition-transform relative z-10" />
            <span className="font-black uppercase tracking-widest text-black text-center text-xs sm:text-xs relative z-10">SST Shop</span>
          </Link>
        </div>
        <Link 
          to="/dash/calendar/2026-27"
          className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
        >
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-400 text-black text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-1 sm:px-2 py-0.5 sm:py-1 border-2 border-black group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
            2026-27
          </div>
          <Calendar className="text-black w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:text-[#3B82F6] transition-colors" />
          <span className="font-black uppercase tracking-widest text-black text-center text-[10px] sm:text-xs">Academic Calendar</span>
        </Link>
        <Link 
          to="/dash/events"
          className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
        >
          <PartyPopper className="text-black w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:text-[#3B82F6] transition-colors" />
          <span className="font-black uppercase tracking-widest text-black text-center text-[10px] sm:text-xs">Events</span>
        </Link>

        <Link 
          to="/dash/class"
          className="relative flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white border-4 border-black p-3 sm:p-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
        >
          <FileText className="text-black w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:text-[#3B82F6] transition-colors" />
          <span className="font-black uppercase tracking-widest text-black text-center text-[10px] sm:text-xs">Classes</span>
        </Link>
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

    </div>
  );
}
