import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

export default function FacultyDashboard() {
  const { userData } = useOutletContext<{ userData: any }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Faculty Dashboard - SST Hub';
    if (userData && userData.type !== 'faculty' && userData.type !== 'admin') {
      navigate('/dash');
    }
  }, [userData, navigate]);

  useEffect(() => {
    fetch('/api/faculty/classes')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setClasses(data.data);
        }
      })
      .catch(err => console.error("Error fetching faculty classes:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col w-full h-full min-h-[60vh] gap-6">
      <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-purple-600">Your Classes</h1>
        <p className="font-bold text-gray-500 mt-2 uppercase tracking-widest text-sm">Manage and View Your Assigned Classes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center p-8 font-black uppercase tracking-widest">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-full text-center p-8 font-black uppercase tracking-widest bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            You don't have any classes assigned yet.
          </div>
        ) : (
          classes.map(c => (
            <button 
              key={c.id} 
              onClick={() => navigate(`/faculty/class/${c.id}`)}
              className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] transition-all flex flex-col items-center gap-4 text-center group"
            >
              {c.logo ? (
                <img src={c.logo} alt={c.name} className="w-24 h-24 border-4 border-black object-cover" />
              ) : (
                <div className="w-24 h-24 border-4 border-black bg-purple-100 flex items-center justify-center text-3xl font-black text-purple-800">
                  {c.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-black uppercase tracking-tight text-xl group-hover:text-purple-600 transition-colors">{c.name}</h3>
                <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mt-1">ID: {c.id}</p>
                {c.description && <p className="font-bold text-sm mt-2 line-clamp-2">{c.description}</p>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
