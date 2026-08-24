import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, List, Grid, ChevronRight, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import calendarData from '../data/calendar_2026_27.json';

type EventType = 'holiday' | 'break' | 'exam' | 'important';

interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  type: EventType;
}

const allEvents = calendarData.events as CalendarEvent[];

const getTypeStyle = (type: EventType) => {
  switch (type) {
    case 'holiday': return 'bg-[#8B5CF6] text-white border-black';
    case 'break': return 'bg-yellow-400 text-black border-black';
    case 'exam': return 'bg-[#3B82F6] text-white border-black';
    case 'important': return 'bg-emerald-500 text-white border-black';
    default: return 'bg-gray-200 text-black border-black';
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatRange = (start: string, end: string) => {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<'upcoming' | 'full'>('upcoming');

  // Logic for upcoming events
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    // Reset time for accurate day comparison
    today.setHours(0, 0, 0, 0);

    const futureEvents = allEvents.filter(e => {
      const eDate = new Date(e.endDate);
      eDate.setHours(23, 59, 59, 999);
      return eDate >= today;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return futureEvents.slice(0, 7);
  }, []);

  // Group all events by month for full year view
  const groupedEvents = useMemo(() => {
    const sorted = [...allEvents].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const groups: { [key: string]: CalendarEvent[] } = {};
    
    sorted.forEach(e => {
      const d = new Date(e.startDate);
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(e);
    });
    return groups;
  }, []);

  const holidaysAndBreaks = useMemo(() => {
    return allEvents.filter(e => e.type === 'holiday' || e.type === 'break')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-6">
        <div className="flex flex-col items-start gap-4">
          <button 
            onClick={() => navigate('/dash')}
            className="flex items-center gap-2 font-black uppercase tracking-widest border-2 border-black px-3 py-1 text-xs md:text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-black flex items-center gap-3">
              <CalendarIcon size={40} className="text-black" />
              Calendar
            </h1>
            <p className="text-black/70 font-bold uppercase tracking-widest mt-2 text-sm md:text-base">
              Academic Year 2026-2027
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
            <Sparkles size={16} /> Upcoming
          </button>
          <div className="w-1 bg-black shrink-0"></div>
          <button
            onClick={() => setView('full')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs md:text-sm transition-colors ${
              view === 'full' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <List size={16} /> Full Year
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'upcoming' && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-[#8B5CF6] rounded-full animate-pulse border-2 border-black"></div>
                <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-1">
                  Upcoming Events
                </h2>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingEvents.map((event, i) => (
                    <div key={i} className={`flex flex-col md:flex-row border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all`}>
                      <div className={`p-4 md:w-48 flex-shrink-0 flex items-center justify-center text-center font-black uppercase tracking-widest border-b-4 md:border-b-0 md:border-r-4 ${getTypeStyle(event.type)}`}>
                        {formatDate(event.startDate)}
                      </div>
                      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl md:text-2xl font-black uppercase">{event.title}</h3>
                        <p className="font-bold text-black/60 text-xs md:text-sm tracking-widest mt-2 uppercase">
                          {event.startDate !== event.endDate ? `Ends on ${formatDate(event.endDate)}` : 'Single Day Event'} • {event.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#f4f4f5] border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-black text-xl uppercase tracking-widest">No Upcoming Events Found</p>
                  <p className="font-bold text-black/50 mt-2">You have a clear schedule for now!</p>
                </div>
              )}
            </section>
          )}

          {view === 'full' && (
            <section className="space-y-12">
              <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-1 mb-2">
                Complete Schedule
              </h2>
              
              {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <div key={month} className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-widest bg-black text-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {month}
                  </h3>
                  <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {monthEvents.map((event, i) => (
                      <div key={i} className={`flex flex-col md:flex-row border-b-4 border-black last:border-b-0 hover:bg-gray-50 transition-colors`}>
                        <div className={`w-full md:w-48 p-3 font-black text-xs md:text-sm uppercase tracking-widest border-b-4 md:border-b-0 md:border-r-4 border-black flex items-center ${getTypeStyle(event.type)}`}>
                          {formatRange(event.startDate, event.endDate)}
                        </div>
                        <div className="p-3 md:px-6 flex-1 flex items-center justify-between">
                          <span className="font-black text-sm md:text-base uppercase">{event.title}</span>
                          <span className="hidden md:inline-block text-[10px] font-bold tracking-widest uppercase bg-black text-white px-2 py-1 ml-4 whitespace-nowrap">
                            {event.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      <section className="mt-16 pt-8 border-t-8 border-black">
        <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-1 mb-6">
          Holidays & Vacations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidaysAndBreaks.map((item, i) => (
            <div key={i} className={`p-4 border-4 border-black flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform ${item.type === 'break' ? 'bg-yellow-400' : 'bg-white'}`}>
              <h4 className="font-black uppercase text-lg mb-2">{item.title}</h4>
              <p className="font-bold text-xs uppercase tracking-widest bg-black text-white p-2 inline-block self-start border-2 border-black">
                {formatRange(item.startDate, item.endDate)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
