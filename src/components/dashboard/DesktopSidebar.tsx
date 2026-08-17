import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Globe, LogOut, ChevronLeft, ChevronRight, UserCog, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function DesktopSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isActive = (path: string) => {
    if (path === '/dash') return location.pathname === '/dash';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string) => `
    flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap
    ${isActive(path) 
      ? 'bg-[#3B82F6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' 
      : 'bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    }
  `;

  const isAdminDash = location.pathname.startsWith('/admindash');
  const searchParams = new URLSearchParams(location.search);
  const adminTab = searchParams.get('tab') || 'users';

  const adminNavItemClass = (tab: string) => `
    flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap
    ${adminTab === tab 
      ? (tab === 'users' ? 'bg-[#3B82F6]' : 'bg-red-500') + ' text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' 
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
          SST
          <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100 ml-1'}`}>
            <span className="text-white px-2 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full">
        {isAdminDash ? (
          <>
            <Link to="/dash" className={`${navItemClass('/dash')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <ArrowLeft size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Back</span>
            </Link>
            <Link to="/admindash?tab=users" className={`${adminNavItemClass('users')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <Users size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Users</span>
            </Link>
            <Link to="/admindash?tab=faculty" className={`${adminNavItemClass('faculty')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <UserCog size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Faculty</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dash" className={`${navItemClass('/dash')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <Home size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Dashboard</span>
            </Link>
            <Link to="/dash/community" className={`${navItemClass('/dash/community')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <Globe size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Community</span>
            </Link>
            <Link to="/dash/social" className={`${navItemClass('/dash/social')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <Users size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Social</span>
            </Link>
            <Link to="/dash/profile" className={`${navItemClass('/dash/profile')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <User size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Profile</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
