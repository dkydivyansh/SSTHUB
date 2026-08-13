import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut } from 'lucide-react';

export default function DesktopSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 font-black uppercase tracking-widest p-4 border-4 border-black transition-all
    ${isActive(path) 
      ? 'bg-[#EE5455] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' 
      : 'bg-white text-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    }
  `;

  return (
    <aside className="hidden lg:flex flex-col w-80 bg-[#FFF5E1] border-r-4 border-black h-screen p-8 sticky top-0">
      <div className="mb-12">
        <div className="font-black text-3xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 inline-block">
          SST<span className="text-white px-2 ml-1 border-2 border-black rotate-2 inline-block bg-[#EE5455]">Hub</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        <Link to="/dash" className={navItemClass('/dash')}>
          <Home size={24} />
          <span>Dashboard</span>
        </Link>
        <Link to="/dash/profile" className={navItemClass('/dash/profile')}>
          <User size={24} />
          <span>Profile</span>
        </Link>
      </nav>

      <div className="mt-auto pt-8">
        <Link 
          to="/logout" 
          className="flex items-center gap-3 font-black uppercase tracking-widest p-4 bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors"
        >
          <LogOut size={24} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
