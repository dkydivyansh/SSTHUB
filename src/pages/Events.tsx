import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, ArrowLeft, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import PostCard from '../components/PostCard';

interface EventItem {
  id: number;
  groupid: string;
  post_type: 'event';
  context: {
    title: string;
    content: string;
    tags?: string[];
    type: 'virtual' | 'offline';
    time: string; // YYYY-MM-DD HH:MM:SS
  };
  created_at: string;
  pinned: boolean;
  extras: any;
  created_by: number;
  group_name: string;
  group_logo: string;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    document.title = 'Events - SST Hub';
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events_feed?offset=0');
      const json = await res.json();
      if (json.status === 'success') {
        setEvents(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { upcomingGroups, pastGroups } = useMemo(() => {
    const today = new Date();
    const upcoming: { [dateStr: string]: EventItem[] } = {};
    const past: { [dateStr: string]: EventItem[] } = {};

    const getSafeDate = (dateStr: string | undefined) => {
      if (!dateStr) return new Date();
      const safeStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
      return new Date(safeStr);
    };

    // Sort all events chronologically
    const sorted = [...events].sort((a, b) => {
      const timeA = getSafeDate(a.context?.time || a.created_at).getTime();
      const timeB = getSafeDate(b.context?.time || b.created_at).getTime();
      return timeA - timeB; // Ascending order
    });

    sorted.forEach(ev => {
      const evDate = getSafeDate(ev.context?.time || ev.created_at);
      const dateStr = evDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      if (evDate >= today) {
        if (!upcoming[dateStr]) upcoming[dateStr] = [];
        upcoming[dateStr].push(ev);
      } else {
        if (!past[dateStr]) past[dateStr] = [];
        past[dateStr].push(ev);
      }
    });

    // Past events should probably be shown from newest to oldest
    const sortedPastGroups: { [dateStr: string]: EventItem[] } = {};
    Object.keys(past).reverse().forEach(key => {
      // reverse the inner array too to show newest first
      sortedPastGroups[key] = past[key].reverse();
    });

    return { upcomingGroups: upcoming, pastGroups: sortedPastGroups };
  }, [events]);

  return (
    <div className="w-full h-full flex flex-col min-h-[60vh] relative max-w-4xl mx-auto space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-6 px-4 md:px-0">
        <div className="flex flex-col items-start gap-4">
          <button 
            onClick={() => navigate('/dash')}
            className="flex items-center gap-2 font-black uppercase tracking-widest border-2 border-black px-3 py-1 text-xs md:text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-black flex items-center gap-3">
              <PartyPopper size={40} className="text-black" />
              Events
            </h1>
            <p className="text-black/70 font-bold uppercase tracking-widest mt-2 text-sm md:text-base">
              Community Events & Meetups
            </p>
          </div>
        </div>
        
        <div className="flex border-4 border-black w-full md:w-auto overflow-hidden">
          <button
            onClick={() => setView('upcoming')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs md:text-sm transition-colors ${
              view === 'upcoming' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <div className="w-1 bg-black shrink-0"></div>
          <button
            onClick={() => setView('past')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs md:text-sm transition-colors ${
              view === 'past' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Past Events
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 size={48} className="animate-spin text-black" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'upcoming' && (
              <section className="space-y-12">
                {Object.keys(upcomingGroups).length > 0 ? (
                  Object.entries(upcomingGroups).map(([date, items]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex items-center gap-3 px-4 md:px-0">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-1">
                          {date}
                        </h2>
                      </div>
                      <div className="flex flex-col gap-6 pt-4">
                        {items.map((item, i) => (
                          <div key={i} className="hover:-translate-y-1 transition-transform">
                            <PostCard item={item as any} isDashboard={true} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f4f4f5] border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-black text-xl uppercase tracking-widest">No Upcoming Events</p>
                    <p className="font-bold text-black/50 mt-2">Check back later or check your joined groups!</p>
                  </div>
                )}
              </section>
            )}

            {view === 'past' && (
              <section className="space-y-12">
                {Object.keys(pastGroups).length > 0 ? (
                  Object.entries(pastGroups).map(([date, items]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex items-center gap-3 opacity-60 px-4 md:px-0">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-1">
                          {date}
                        </h2>
                      </div>
                      <div className="flex flex-col gap-6 pt-4">
                        {items.map((item, i) => (
                          <div key={i} className="relative group">
                            {/* Grayscale and opacity for past events */}
                            <div className="opacity-70 grayscale pointer-events-none">
                              <PostCard item={item as any} isDashboard={true} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f4f4f5] border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-black text-xl uppercase tracking-widest">No Past Events</p>
                  </div>
                )}
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
