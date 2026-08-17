import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Globe } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dash') return location.pathname === '/dash';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${isActive(path) ? 'text-[#3B82F6]' : 'text-black hover:text-[#3B82F6]'}
  `;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-1 px-2 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      <Link to="/dash" className={navItemClass('/dash')}>
        <Home size={20} className={isActive('/dash') ? 'fill-[#3B82F6]' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Home</span>
      </Link>
      
      <Link to="/dash/community" className={navItemClass('/dash/community')}>
        <Globe size={20} className={isActive('/dash/community') ? 'fill-[#3B82F6]' : ''} />
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

    </nav>
  );
}
