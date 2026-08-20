import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function DashboardLayout() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          if (data.data.status === 'disabled') {
            navigate('/login?error=' + encodeURIComponent('Your account has been disabled.'));
            return;
          }
          if (data.data.status === 'pending') {
            navigate('/onboarding');
            return;
          }
          setUserData(data.data);
        } else {
          navigate('/login');
        }
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5E1]">
        <div className="text-2xl font-black uppercase tracking-widest animate-pulse">
          Loading Data...
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#FFF5E1] flex font-sans">
      <DesktopSidebar />
      
      <main id="dashboard-main" className="flex-1 flex flex-col relative pb-16 lg:pb-0 overflow-x-hidden">

        <div className="p-4 sm:p-8 lg:p-12 w-full max-w-7xl mx-auto flex-1 overflow-hidden">
          <Outlet context={{ userData }} />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
