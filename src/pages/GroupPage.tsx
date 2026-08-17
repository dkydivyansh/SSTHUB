import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto min-h-[80vh] relative pb-20 p-4 md:p-8">
      <div className="bg-white border-4 border-black p-4 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter truncate pr-2">Group {groupId}</h1>
          <button 
            onClick={() => navigate('/dash/community')}
            className="bg-black text-white px-3 md:px-4 py-2 font-black uppercase text-xs md:text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 md:gap-2 shrink-0"
          >
            <ArrowLeft size={16} className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>
        
        <div className="bg-[#f4f4f5] border-4 border-black p-6 md:p-10 text-center flex flex-col items-center justify-center gap-4 min-h-[200px] md:min-h-[300px]">
          <h2 className="text-xl md:text-2xl font-black uppercase text-gray-500 tracking-widest">Group Content Placeholder</h2>
          <p className="font-bold text-gray-500 text-sm md:text-base">More details and actual group interface coming soon.</p>
        </div>
      </div>
    </div>
  );
}
