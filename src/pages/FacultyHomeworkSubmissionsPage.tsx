import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, Clock, File, X, ExternalLink } from 'lucide-react';

export default function FacultyHomeworkSubmissionsPage() {
  const { classId, homeworkId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; student: any }>({ isOpen: false, student: null });

  useEffect(() => {
    fetchData();
  }, [classId, homeworkId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/homework/submissions/get?class_id=${classId}&homework_id=${homeworkId}`);
      const result = await res.json();
      if (result.status === 'success') {
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-[#FFF5E1]">
        <div className="w-12 h-12 border-4 border-black border-t-purple-600 rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest animate-pulse">Loading Submissions...</p>
      </div>
    );
  }

  if (!data || !data.homework) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-[#FFF5E1]">
        <p className="font-black uppercase tracking-widest text-red-600">Failed to load data.</p>
        <button onClick={() => navigate(`/faculty/class/${classId}`)} className="px-6 py-2 border-4 border-black bg-white hover:bg-gray-100 font-bold uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  const filteredStudents = data.students.filter((student: any) => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.rollno && student.rollno.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF5E1] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b-4 border-black p-4 shadow-[0_4px_0_0_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/faculty/class/${classId}`)} className="text-black hover:text-purple-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter truncate max-w-[200px] sm:max-w-md">
              Submissions: {data.homework.title}
            </h1>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
              Total Joined Students: {data.stats.total_students}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8 mt-4">
        
        {/* Stats & Search Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex gap-4">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-w-[120px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Submitted</span>
              <span className="text-3xl font-black text-purple-600">{data.stats.total_submitted}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-w-[120px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pending</span>
              <span className="text-3xl font-black text-red-600">{data.stats.total_students - data.stats.total_submitted}</span>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or roll no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border-4 border-black p-3 pl-10 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b-4 border-black bg-gray-100 font-black uppercase tracking-widest text-xs">
            <div>Student</div>
            <div className="hidden sm:block text-center">Status</div>
            <div className="hidden sm:block text-center">Submitted At</div>
            <div className="text-right">Action</div>
          </div>
          
          <div className="flex flex-col divide-y-4 divide-black">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest">
                No students found.
              </div>
            ) : (
              filteredStudents.map((student: any) => (
                <div key={student.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full border-2 border-black shrink-0 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-black bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="font-black text-purple-800">{student.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold truncate">{student.name}</span>
                      <span className="text-xs text-gray-500 font-medium truncate">{student.rollno || student.email}</span>
                      {/* Mobile Status Details */}
                      <div className="flex sm:hidden items-center gap-2 mt-1">
                        {student.is_submitted ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Submitted</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1"><Clock size={10} /> Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Status Details */}
                  <div className="hidden sm:flex items-center justify-center">
                    {student.is_submitted ? (
                      <span className="bg-emerald-100 text-emerald-800 border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> Turned In</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> Pending</span>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center justify-center text-xs font-bold text-gray-500">
                    {student.is_submitted && student.submitted_at ? new Date(student.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </div>

                  <div className="flex items-center justify-end">
                    {student.is_submitted ? (
                      <button 
                        onClick={() => setModalState({ isOpen: true, student })}
                        className="p-2 bg-purple-600 text-white border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        title="View Work"
                      >
                        <File size={20} />
                      </button>
                    ) : (
                      <div className="w-9 h-9"></div> // Placeholder for alignment
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Submission Modal */}
      {modalState.isOpen && modalState.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-black p-6 md:p-8 max-w-lg w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6 border-b-4 border-black pb-4">
              <div className="flex flex-col">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight">
                  {modalState.student.name}'s Work
                </h3>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Submitted: {new Date(modalState.student.submitted_at).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => setModalState({ isOpen: false, student: null })}
                className="p-2 border-2 border-transparent hover:border-black hover:bg-gray-100 transition-colors -mr-2 -mt-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] p-1">
              {(() => {
                const submission = modalState.student.submission;
                const files = Array.isArray(submission) ? submission : (submission?.files || []);
                
                if (!files || files.length === 0) {
                  return <p className="text-gray-500 font-bold italic text-center py-8">No files were attached to this submission.</p>;
                }
                
                return files.map((file: any, idx: number) => (
                  <a 
                    key={idx} 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border-2 border-black bg-purple-50 hover:bg-purple-100 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <File size={24} className="text-purple-600 shrink-0" />
                      <span className="font-bold truncate group-hover:underline">{file.name}</span>
                    </div>
                    <ExternalLink size={20} className="text-gray-400 group-hover:text-black shrink-0 ml-4" />
                  </a>
                ));
              })()}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setModalState({ isOpen: false, student: null })}
                className="px-6 py-2 bg-black text-white border-2 border-black font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
