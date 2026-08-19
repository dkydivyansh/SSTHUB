import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.status !== 'disabled') {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF5E1] flex flex-col items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center flex flex-col gap-6">
        <ShieldAlert size={64} className="text-red-500 mx-auto" />
        <h1 className="text-6xl font-black uppercase tracking-tighter">404</h1>
        <p className="font-bold text-gray-700 text-lg">Page not found.</p>
        <p className="font-bold text-gray-500 text-sm">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        {isLoggedIn === null ? (
          <div className="h-12 flex items-center justify-center">
            <span className="animate-pulse font-black uppercase text-sm tracking-widest text-gray-400">Loading...</span>
          </div>
        ) : (
          <Link
            to={isLoggedIn ? "/dash" : "/"}
            className="flex items-center justify-center gap-2 bg-[#3B82F6] text-white border-4 border-black py-4 px-6 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <ArrowLeft size={20} />
            {isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}
          </Link>
        )}
      </div>
    </div>
  );
}
