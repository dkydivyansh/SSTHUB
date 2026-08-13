import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Send revoke request to clear backend session and cookies
    fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'revoke' })
    })
      .then(() => {
        // Redirect to login regardless of API success/failure
        navigate('/login');
      })
      .catch((err) => {
        console.error('Logout failed:', err);
        navigate('/login');
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5E1] font-sans p-8">
      <div className="text-2xl font-black uppercase tracking-widest text-black/50 animate-pulse">
        Logging out...
      </div>
    </div>
  );
}
