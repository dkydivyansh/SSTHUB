import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function StudentClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const showInfo = (title: string, message: string) => setModalState({ isOpen: true, title, message });
  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  useEffect(() => {
    Promise.all([
      fetch('/api/student/classes').then(r => r.json()),
      fetch(`/api/homework/get?class_id=${classId}`).then(r => r.json())
    ])
      .then(([classesRes, hwRes]) => {
        if (classesRes.status === 'success') {
          const found = classesRes.data.find((c: any) => c.id === classId);
          if (found) {
            setClassData(found);
            document.title = `${found.name} Homework - SST Hub`;
          } else {
            navigate('/dash/class');
          }
        }
        if (hwRes.status === 'success') {
          const hwData = hwRes.data || [];
          
          // Sort logic: pending first, then completed. Secondary sort by expires_at.
          hwData.sort((a: any, b: any) => {
            const aSubmitted = a.is_submitted === 1;
            const bSubmitted = b.is_submitted === 1;
            
            if (aSubmitted !== bSubmitted) {
              return aSubmitted ? 1 : -1; // Pending comes first
            }
            
            // If both same status, sort by expires_at (earliest first for pending, latest first for completed, or just earliest first)
            if (a.expires_at && b.expires_at) {
              return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
            }
            return 0;
          });
          
          setHomework(hwData);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [classId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-black uppercase tracking-widest animate-pulse">Loading Class...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FFF5E1] p-4 md:p-8 max-w-5xl mx-auto gap-8">
      
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-4">
          <Link to="/dash/class" className="text-black hover:text-purple-600 transition-colors">
            <ArrowLeft size={32} strokeWidth={3} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black">
              {classData?.name}
            </h1>
            <span className="font-bold uppercase tracking-widest text-sm text-gray-500">
              Homework & Assignments
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {homework.length === 0 ? (
          <div className="w-full bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">No Homework</h2>
            <p className="font-bold text-gray-500">You're all caught up! There is no homework assigned for this class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {homework.map((hw) => {
              const isSubmitted = hw.is_submitted === 1;
              const isOverdue = hw.expires_at && new Date(hw.expires_at) < new Date();
              
              const content = (
                <>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 mt-1">
                      {isSubmitted ? (
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      ) : isOverdue ? (
                        <Circle size={32} className="text-red-500" />
                      ) : (
                        <Circle size={32} className="text-purple-600" />
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <h3 className="font-black uppercase tracking-tighter text-xl sm:text-2xl group-hover:text-purple-600 transition-colors break-words whitespace-normal">
                        {hw.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          Assigned: {new Date(hw.created_at).toLocaleDateString()}
                        </div>
                        {hw.expires_at && (
                          <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${isOverdue && !isSubmitted ? 'text-red-500' : 'text-gray-500'}`}>
                            <Clock size={12} />
                            Due: {new Date(hw.expires_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2">
                        {hw.user_submission?.score !== undefined && (
                          <span className="bg-purple-100 text-purple-800 border-2 border-black px-3 py-1 text-sm font-black uppercase tracking-widest">
                            {hw.user_submission.score}%
                          </span>
                        )}
                        <span className="bg-emerald-100 text-emerald-800 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest">
                          Completed
                        </span>
                      </div>
                    ) : isOverdue ? (
                      <span className="bg-red-100 text-red-800 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest">
                        Overdue
                      </span>
                    ) : (
                      <span className="text-purple-600 font-black uppercase tracking-widest text-xs">Pending</span>
                    )}
                  </div>
                </>
              );

              if (isOverdue && !isSubmitted) {
                return (
                  <div 
                    key={hw.id}
                    onClick={() => showInfo('Deadline Passed', 'This assignment is overdue and can no longer be accessed.')}
                    className="bg-gray-50 border-4 border-gray-300 p-4 md:p-6 opacity-70 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {content}
                  </div>
                );
              }
              
              return (
                <Link 
                  key={hw.id}
                  to={`/dash/class/${classId}/homework/${hw.id}`}
                  className="bg-white border-4 border-black p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Popup Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white border-4 border-black w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] flex flex-col">
            <div className="p-6 text-center flex flex-col gap-4">
              <h3 className="font-black uppercase tracking-tighter text-2xl">{modalState.title}</h3>
              <p className="font-bold text-gray-700">{modalState.message}</p>
            </div>
            <div className="flex border-t-4 border-black">
              <button 
                onClick={closeModal}
                className="flex-1 p-4 bg-black text-white font-black uppercase tracking-widest hover:bg-purple-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
