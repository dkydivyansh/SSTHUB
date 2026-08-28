import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Edit } from 'lucide-react';

export default function FacultyClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/faculty/classes').then(r => r.json()),
      fetch(`/api/homework/get?class_id=${classId}`).then(r => r.json())
    ])
      .then(([classesRes, hwRes]) => {
        if (classesRes.status === 'success') {
          const found = classesRes.data.find((c: any) => c.id === classId);
          if (found) {
            setClassData(found);
            document.title = `${found.name} - SST Hub`;
          } else {
            navigate('/faculty');
          }
        }
        if (hwRes.status === 'success') {
          setHomework(hwRes.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [classId, navigate]);

  const handleDelete = async (homeworkId: string) => {
    if (!confirm('Are you sure you want to delete this homework? This cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/homework/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, homework_id: homeworkId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHomework(prev => prev.filter(hw => hw.id !== homeworkId));
      } else {
        alert(data.message || 'Error deleting homework');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-black uppercase tracking-widest animate-pulse">Loading Class...</div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="flex flex-col w-full h-full min-h-[60vh] gap-4 max-w-4xl mx-auto">
      <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {classData.logo ? (
            <img src={classData.logo} alt={classData.name} className="w-16 h-16 border-4 border-black object-cover bg-white shrink-0" />
          ) : (
            <div className="w-16 h-16 border-4 border-black bg-purple-100 flex items-center justify-center font-black text-2xl text-purple-800 shrink-0">
              {classData.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-purple-600 line-clamp-1">{classData.name}</h1>
            <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mt-1">Class ID: {classId}</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate(`/faculty/class/${classId}/homework/create`)}
          className="bg-black text-white px-4 py-2 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all border-4 border-black"
        >
          Create Homework
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-black border-b-4 border-black pb-2">Homework & Assignments</h2>
        
        {homework.length === 0 ? (
          <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-center text-sm">No homework published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {homework.map((hw: any) => (
              <div key={hw.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 transition-transform">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-tighter text-lg">{hw.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">
                      <span>Created: {new Date(hw.created_at).toLocaleDateString()}</span>
                      {hw.expires_at && (
                        <span className="text-red-500">Deadline: {new Date(hw.expires_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {hw.status === 'draft' ? (
                      <span className="bg-yellow-200 text-yellow-800 border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-widest">Draft</span>
                    ) : (
                      <span className="bg-emerald-200 text-emerald-800 border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-widest">Published</span>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => navigate(`/faculty/class/${classId}/homework/${hw.id}/edit`)}
                        className="p-2 border-2 border-black bg-white hover:bg-purple-100 transition-colors text-purple-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(hw.id)}
                        className="p-2 border-2 border-black bg-white hover:bg-red-100 transition-colors text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
