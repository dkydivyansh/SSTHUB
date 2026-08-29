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
              className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] transition-all flex flex-col gap-4 text-left group"
            >
              <div className="flex flex-col flex-1">
                <h3 className="font-black uppercase tracking-tight text-2xl group-hover:text-purple-600 transition-colors">{c.name}</h3>
                <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mt-1">ID: {c.id}</p>
                {c.description && <p className="font-bold text-sm mt-2 line-clamp-2">{c.description}</p>}
              </div>
              <div className="mt-4 pt-4 border-t-4 border-black flex justify-between items-center w-full">
                <span className="font-black text-xs uppercase tracking-widest text-purple-600">Faculty</span>
                <div className="px-4 py-2 bg-black text-white font-black text-xs uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all">
                  Manage
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
