import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Users, Compass, LogOut, ChevronLeft, ChevronRight, UserCog, ArrowLeft, Grid, Megaphone, Calendar, Info, BookOpen, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';
import { useGroupUnreadCounts } from '../../hooks/useGroupUnreadCounts';

interface DesktopSidebarProps {
  userData?: any;
}

export default function DesktopSidebar({ userData }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { unreadCommunity, unreadSocial } = useUnreadCounts();

  const groupMatch = location.pathname.match(/^\/dash\/community\/([^/]+)\/?([^/]*)$/);
  const isGroupPage = !!groupMatch && location.pathname !== '/dash/community';
  const groupId = groupMatch ? groupMatch[1] : '';
  const activeGroupTab = groupMatch && groupMatch[2] ? groupMatch[2] : 'announcements';

  const { counts: groupCounts, markRead: markGroupRead } = useGroupUnreadCounts(isGroupPage ? groupId : '');

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
  let adminTab = 'users';
  if (location.pathname.includes('/admindash/faculty')) adminTab = 'faculty';
  if (location.pathname.includes('/admindash/groups')) adminTab = 'groups';
  if (location.pathname.includes('/admindash/classes')) adminTab = 'classes';

  const adminNavItemClass = (tab: string) => `
    flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap
    ${adminTab === tab
      ? (tab === 'users' ? 'bg-[#3B82F6]' : tab === 'faculty' ? 'bg-red-500' : 'bg-emerald-500') + ' text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1'
      : 'bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    }
  `;

  const groupNavItemClass = (tab: string) => `
    flex items-center font-black uppercase tracking-widest p-4 border-4 border-black transition-all duration-300 overflow-hidden whitespace-nowrap
    ${activeGroupTab === tab
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
          SST
          <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100 ml-1'}`}>
            <span className="text-white px-2 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full">
        {isAdminDash ? (
          <>
            <button onClick={() => navigate('/dash')} className={`${navItemClass('/dash')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <ArrowLeft size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Back</span>
            </button>
            <button onClick={() => navigate('/admindash/users')} className={`${adminNavItemClass('users')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <Users size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Users</span>
            </button>
            <button onClick={() => navigate('/admindash/faculty')} className={`${adminNavItemClass('faculty')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <UserCog size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Faculty</span>
            </button>
            <button onClick={() => navigate('/admindash/groups')} className={`${adminNavItemClass('groups')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <Grid size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Groups</span>
            </button>
            <button onClick={() => navigate('/admindash/classes')} className={`${adminNavItemClass('classes')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <BookOpen size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Classes</span>
            </button>
          </>
        ) : isGroupPage ? (
          <>
            <button onClick={() => navigate('/dash/community')} className={`${navItemClass('/dash/community')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <ArrowLeft size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Back</span>
            </button>
            <button onClick={() => { markGroupRead('announcements'); navigate(`/dash/community/${groupId}/announcements`); }} className={`${groupNavItemClass('announcements')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full relative`}>
              <div className="relative">
                <Megaphone size={24} className="shrink-0" />
                {groupCounts.announcements > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                    {groupCounts.announcements > 99 ? '99+' : groupCounts.announcements}
                  </div>
                )}
              </div>
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Announcements</span>
            </button>
            <button onClick={() => { markGroupRead('events'); navigate(`/dash/community/${groupId}/events`); }} className={`${groupNavItemClass('events')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full relative`}>
              <div className="relative">
                <Calendar size={24} className="shrink-0" />
                {groupCounts.events > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                    {groupCounts.events > 99 ? '99+' : groupCounts.events}
                  </div>
                )}
              </div>
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Events</span>
            </button>
            <button onClick={() => navigate(`/dash/community/${groupId}/about`)} className={`${groupNavItemClass('about')} ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
              <Info size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>About</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/dash" className={`${navItemClass('/dash')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              <Home size={24} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Dashboard</span>
            </Link>
            <Link to="/dash/community" className={`${navItemClass('/dash/community')} ${isCollapsed ? 'justify-center' : 'justify-start'} relative`}>
              <div className="relative">
                <Compass size={24} className="shrink-0" />
                {unreadCommunity > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                    {unreadCommunity > 99 ? '99+' : unreadCommunity}
                  </div>
                )}
              </div>
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Community</span>
            </Link>
            <Link to="/dash/social" className={`${navItemClass('/dash/social')} ${isCollapsed ? 'justify-center' : 'justify-start'} relative`}>
              <div className="relative">
                <Users size={24} className="shrink-0" />
                {unreadSocial > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                    {unreadSocial > 99 ? '99+' : unreadSocial}
                  </div>
                )}
              </div>
              <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Social</span>
            </Link>

            {(userData?.type === 'faculty' || userData?.type === 'admin') && (
              <Link to="/faculty" className={`${navItemClass('/faculty')} ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <GraduationCap size={24} className="shrink-0" />
                <span className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>Classes</span>
              </Link>
            )}

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
