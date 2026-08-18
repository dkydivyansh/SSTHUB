import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Users, Compass, UserCog, ArrowLeft, Grid, Megaphone, Calendar, Info } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/dash') return location.pathname === '/dash';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${isActive(path) ? 'text-[#3B82F6]' : 'text-black hover:text-[#3B82F6]'}
  `;

  const isAdminDash = location.pathname.startsWith('/admindash');
  let adminTab = 'users';
  if (location.pathname.includes('/admindash/faculty')) adminTab = 'faculty';
  if (location.pathname.includes('/admindash/groups')) adminTab = 'groups';

  const adminNavItemClass = (tab: string) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${adminTab === tab ? (tab === 'users' ? 'text-[#3B82F6]' : tab === 'faculty' ? 'text-red-500' : 'text-emerald-500') : 'text-black hover:text-[#3B82F6]'}
  `;

  const groupMatch = location.pathname.match(/^\/dash\/community\/([^/]+)\/?([^/]*)$/);
  const isGroupPage = !!groupMatch && location.pathname !== '/dash/community';
  const groupId = groupMatch ? groupMatch[1] : '';
  const activeTab = groupMatch && groupMatch[2] ? groupMatch[2] : 'announcements';

  const groupNavItemClass = (tab: string) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${activeTab === tab ? 'text-[#3B82F6]' : 'text-black hover:text-[#3B82F6]'}
  `;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-1 px-2 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      {isAdminDash ? (
        <>
          <button onClick={() => navigate('/dash')} className={navItemClass('/dash')}>
            <ArrowLeft size={20} className={isActive('/dash') ? 'text-[#3B82F6]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Back</span>
          </button>
          
          <button onClick={() => navigate('/admindash/users')} className={adminNavItemClass('users')}>
            <Users size={20} className={adminTab === 'users' ? 'fill-[#3B82F6]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Users</span>
          </button>
          
          <button onClick={() => navigate('/admindash/faculty')} className={adminNavItemClass('faculty')}>
            <UserCog size={20} className={adminTab === 'faculty' ? 'fill-red-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Faculty</span>
          </button>
          
          <button onClick={() => navigate('/admindash/groups')} className={adminNavItemClass('groups')}>
            <Grid size={20} className={adminTab === 'groups' ? 'fill-emerald-500 text-emerald-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Groups</span>
          </button>
        </>
      ) : isGroupPage ? (
        <>
          <button onClick={() => navigate('/dash/community')} className={navItemClass('/dash/community')}>
            <ArrowLeft size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Back</span>
          </button>
          
          <button onClick={() => navigate(`/dash/community/${groupId}/announcements`)} className={groupNavItemClass('announcements')}>
            <Megaphone size={20} strokeWidth={activeTab === 'announcements' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Announce</span>
          </button>
          
          <button onClick={() => navigate(`/dash/community/${groupId}/events`)} className={groupNavItemClass('events')}>
            <Calendar size={20} strokeWidth={activeTab === 'events' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Events</span>
          </button>
          
          <button onClick={() => navigate(`/dash/community/${groupId}/about`)} className={groupNavItemClass('about')}>
            <Info size={20} strokeWidth={activeTab === 'about' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">About</span>
          </button>
        </>
      ) : (
        <>
          <Link to="/dash" className={navItemClass('/dash')}>
            <Home size={20} className={isActive('/dash') ? 'fill-[#3B82F6]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Home</span>
          </Link>
          
          <Link to="/dash/community" className={navItemClass('/dash/community')}>
            <Compass size={20} strokeWidth={isActive('/dash/community') ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Community</span>
          </Link>
          
          <Link to="/dash/social" className={navItemClass('/dash/social')}>
            <Users size={20} className={isActive('/dash/social') ? 'fill-[#3B82F6]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Social</span>
          </Link>

          <Link to="/dash/profile" className={navItemClass('/dash/profile')}>
            <User size={20} className={isActive('/dash/profile') ? 'fill-[#3B82F6]' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Profile</span>
          </Link>
        </>
      )}

    </nav>
  );
}
