import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex flex-col items-center justify-center p-2 flex-1 transition-colors
    ${isActive(path) ? 'text-[#EE5455]' : 'text-black hover:text-[#EE5455]'}
  `;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex items-center justify-around py-1 px-2 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      <Link to="/dash" className={navItemClass('/dash')}>
        <Home size={20} className={isActive('/dash') ? 'fill-[#EE5455]' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Home</span>
      </Link>
      
      <Link to="/dash/profile" className={navItemClass('/dash/profile')}>
        <User size={20} className={isActive('/dash/profile') ? 'fill-[#EE5455]' : ''} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Profile</span>
      </Link>

      <Link to="/logout" className="flex flex-col items-center justify-center p-2 flex-1 text-black hover:text-[#EE5455] transition-colors">
        <LogOut size={20} />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">Logout</span>
      </Link>
    </nav>
  );
}
