import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function DesktopSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 font-black uppercase tracking-widest p-4 border-4 border-black transition-all
    ${isActive(path) 
      ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' 
      : 'bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    }
  `;

  return (
    <aside className={`hidden lg:flex flex-col bg-[#FFF5E1] border-r-4 border-black h-screen p-8 sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-28 items-center px-4' : 'w-80'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-5 top-10 bg-white border-4 border-black p-1 hover:bg-[#3B82F6] hover:text-white transition-colors z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className={`mb-12 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
        {isCollapsed ? (
          <div className="font-black text-xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-2 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 inline-block">
            SST
          </div>
        ) : (
          <div className="font-black text-3xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 inline-block">
            SST<span className="text-white px-2 ml-1 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full">
        <Link to="/dash" className={`${navItemClass('/dash')} ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <Home size={24} className="shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
        <Link to="/dash/profile" className={`${navItemClass('/dash/profile')} ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <User size={24} className="shrink-0" />
          {!isCollapsed && <span>Profile</span>}
        </Link>
      </nav>

      <div className="mt-auto pt-8 w-full">
        <Link 
          to="/logout" 
          className={`flex items-center gap-3 font-black uppercase tracking-widest p-4 bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={24} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
