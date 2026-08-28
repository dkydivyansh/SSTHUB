import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Settings } from 'lucide-react';

interface ClassBottomNavProps {
  classId: string;
}

export default function ClassBottomNav({ classId }: ClassBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string, exact: boolean = false) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${isActive(path, exact) ? 'text-[#3B82F6]' : 'text-black hover:text-[#3B82F6]'}
  `;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-1 px-2 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      <button onClick={() => navigate('/faculty')} className="flex flex-col items-center justify-center p-2 flex-1 transition-colors text-black hover:text-[#3B82F6]">
        <ArrowLeft size={20} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Back</span>
      </button>
      
      <Link to={`/faculty/class/${classId}`} className={navItemClass(`/faculty/class/${classId}`, true)}>
        <BookOpen size={20} className={isActive(`/faculty/class/${classId}`, true) ? 'fill-[#3B82F6]' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Homework</span>
      </Link>
      
      <Link to={`/faculty/class/${classId}/extras`} className={navItemClass(`/faculty/class/${classId}/extras`)}>
        <Settings size={20} className={isActive(`/faculty/class/${classId}/extras`) ? 'fill-[#3B82F6]' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Extras</span>
      </Link>
    </nav>
  );
}
