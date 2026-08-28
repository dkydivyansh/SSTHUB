import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Settings } from 'lucide-react';
import { useState } from 'react';

interface ClassSidebarProps {
  classId: string;
}

export default function ClassSidebar({ classId }: ClassSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string, exact: boolean = false) => `
    flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap
    ${isActive(path, exact)
      ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1'
      : 'bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    }
  `;

  return (
    <aside
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`hidden lg:flex flex-col bg-[#FFF5E1] border-r-4 border-black h-screen p-8 sticky top-0 transition-all duration-300 z-40 ${isCollapsed ? 'w-28 items-center px-4' : 'w-80'}`}
    >
      <div className={`mb-12 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
        <div className={`font-black text-black tracking-tight uppercase flex items-center bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 transition-all duration-300 ${isCollapsed ? 'text-xl px-2 py-1' : 'text-3xl px-3 py-1'}`}>
          CLASS
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full">
        <button onClick={() => navigate('/faculty')} className={`flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
          <ArrowLeft size={24} className="shrink-0" />
          <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Back to Dash</span>
        </button>
        
        <Link to={`/faculty/class/${classId}`} className={`${navItemClass(`/faculty/class/${classId}`, true)} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <BookOpen size={24} className="shrink-0" />
          <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Homework</span>
        </Link>
        
        <Link to={`/faculty/class/${classId}/extras`} className={`${navItemClass(`/faculty/class/${classId}/extras`)} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <Settings size={24} className="shrink-0" />
          <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Extras</span>
        </Link>
      </nav>
    </aside>
  );
}
