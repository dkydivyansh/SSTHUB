import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, UploadCloud, X, File, Clock } from 'lucide-react';

export default function StudentHomeworkViewer() {
  const { classId, homeworkId } = useParams();
  const navigate = useNavigate();
  const [hw, setHw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Assignment State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Media State
  const [files, setFiles] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/homework/get?class_id=${classId}&homework_id=${homeworkId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setHw(data.data);
          document.title = `${data.data.title} - SST Hub`;
          
          if (data.data.user_submission) {
            // Restore answers if they already submitted
            setAnswers(data.data.user_submission.answers || {});
            setFiles(data.data.user_submission.files || []);
          }
        } else {
          setError('Failed to load homework');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [classId, homeworkId]);

  const isSubmitted = !!hw?.user_submission;
  const isOverdue = hw?.expires_at && new Date(hw.expires_at) < new Date();
  const canSubmit = !isSubmitted && (!isOverdue);

  const handleDriveUpload = () => {
    // Re-use logic from create homework page or open picker
    alert('Google Drive Picker would open here');
    // Mocking an upload
    setFiles(prev => [...prev, { name: 'document.pdf', url: 'https://drive.google.com/...' }]);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submitHomework = async () => {
    if (!confirm('Are you sure you want to submit?')) return;
    setSubmitting(true);
    
    let submissionData = {};
    const type = hw?.extras?.type || 'media';
    
    if (type === 'media') {
      submissionData = { files };
    } else {
      submissionData = { answers };
    }
    
    try {
      const res = await fetch('/api/submit_homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          homework_id: homeworkId,
          submission: submissionData
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Submitted successfully!');
        window.location.reload();
      } else {
        alert(data.message || 'Error submitting');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF5E1]">
        <div className="font-black uppercase tracking-widest animate-pulse">Loading Homework...</div>
      </div>
    );
  }

  if (error || !hw) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF5E1] p-4">
        <div className="bg-white border-4 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="text-2xl font-black uppercase text-red-600 mb-4">Error</h2>
          <p className="font-bold mb-8">{error || 'Not found'}</p>
          <button onClick={() => navigate(-1)} className="bg-black text-white px-6 py-3 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 transition-transform">Go Back</button>
        </div>
      </div>
    );
  }

  const type = hw.extras?.type || 'media';
  const questions = hw.extras?.questions || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF5E1]">
      {/* Top Header */}
      <div className="bg-white border-b-4 border-black p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dash/class/${classId}`)} className="p-2 border-2 border-black hover:bg-purple-100 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-black uppercase tracking-tighter text-xl sm:text-2xl truncate max-w-xs sm:max-w-md">{hw.title}</h1>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              {isSubmitted ? (
                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Turned In</span>
              ) : isOverdue ? (
                <span className="text-red-600">Overdue</span>
              ) : (
                <span className="text-purple-600">Pending</span>
              )}
            </div>
          </div>
        </div>
        
        {isSubmitted && hw.user_submission?.score !== undefined && (
          <div className="bg-purple-100 border-2 border-black px-4 py-2 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Score</span>
            <span className="text-xl font-black text-purple-800 leading-none">{hw.user_submission.score}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-8">
        
        {/* Homework Description */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <p className="whitespace-pre-wrap font-medium">{hw.description}</p>
          {hw.expires_at && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t-2 border-dashed border-gray-300 text-sm font-bold uppercase tracking-widest text-red-600">
              <Clock size={16} /> Due: {new Date(hw.expires_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Media Type UI */}
        {type === 'media' && (
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] flex flex-col gap-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-2">Your Work</h2>
            
            <div className="flex flex-col gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-2 border-black bg-gray-50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File size={24} className="text-purple-600 shrink-0" />
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline truncate">
                      {file.name}
                    </a>
                  </div>
                  {!isSubmitted && (
                    <button onClick={() => removeFile(idx)} className="p-2 hover:bg-red-100 text-red-600 transition-colors border-2 border-transparent hover:border-red-600">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              
              {!isSubmitted && (
                <button 
                  onClick={handleDriveUpload}
                  className="border-4 border-dashed border-black p-8 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <UploadCloud size={48} className="text-purple-600" />
                  <span className="font-black uppercase tracking-widest text-sm">Add Google Drive File</span>
                </button>
              )}
            </div>
            
            {!isSubmitted && (
              <button 
                onClick={submitHomework}
                disabled={submitting || files.length === 0}
                className="w-full bg-black text-white p-4 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {submitting ? 'Submitting...' : 'Turn In Homework'}
              </button>
            )}
          </div>
        )}

        {/* Assignment Type UI (Quiz) */}
        {type === 'assignment' && questions.length > 0 && (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] flex flex-col h-[500px]">
            {/* Quiz Header */}
            <div className="bg-purple-600 text-white p-4 border-b-4 border-black flex items-center justify-between">
              <span className="font-black uppercase tracking-widest">
                Question {currentQuestionIdx + 1} of {questions.length}
              </span>
              {isSubmitted && hw.user_submission?.score !== undefined && (
                <span className="bg-white text-black px-2 py-1 text-xs font-black uppercase border-2 border-black">
                  Score: {hw.user_submission.score}%
                </span>
              )}
            </div>
            
            {/* Quiz Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-8">
                {questions[currentQuestionIdx].text}
              </h3>
              
              <div className="flex flex-col gap-4">
                {questions[currentQuestionIdx].type === 'string' ? (
                  <input 
                    type="text"
                    disabled={isSubmitted}
                    placeholder="Type your answer here..."
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-purple-600/30 disabled:bg-gray-100"
                    value={answers[questions[currentQuestionIdx].id]?.[0] || ''}
                    onChange={(e) => {
                      if (isSubmitted) return;
                      setAnswers({
                        ...answers,
                        [questions[currentQuestionIdx].id]: [e.target.value]
                      });
                    }}
                  />
                ) : (
                  questions[currentQuestionIdx].options?.map((opt: string, idx: number) => {
                    const isMulti = questions[currentQuestionIdx].type === 'multi';
                    const qId = questions[currentQuestionIdx].id;
                    const isSelected = answers[qId]?.includes(opt);
                    
                    return (
                      <label 
                        key={idx} 
                        className={`flex items-center gap-4 p-4 border-4 border-black cursor-pointer transition-all ${isSelected ? 'bg-purple-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1' : 'bg-white hover:bg-gray-50'} ${isSubmitted ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <div className={`w-6 h-6 shrink-0 border-4 border-black flex items-center justify-center bg-white ${isMulti ? '' : 'rounded-full'}`}>
                          {isSelected && <div className={`w-3 h-3 bg-purple-600 ${isMulti ? '' : 'rounded-full'}`} />}
                        </div>
                        <span className="font-bold text-lg select-none">{opt}</span>
                        
                        <input 
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`q-${qId}`}
                          className="hidden"
                          disabled={isSubmitted}
                          checked={isSelected || false}
                          onChange={() => {
                            if (isSubmitted) return;
                            setAnswers(prev => {
                              const curr = prev[qId] || [];
                              if (isMulti) {
                                return { ...prev, [qId]: isSelected ? curr.filter((v: string) => v !== opt) : [...curr, opt] };
                              } else {
                                return { ...prev, [qId]: [opt] };
                              }
                            });
                          }}
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Quiz Footer */}
            <div className="p-4 border-t-4 border-black bg-gray-50 flex items-center justify-between">
              <button 
                onClick={() => setCurrentQuestionIdx(p => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1 font-black uppercase tracking-widest px-4 py-2 border-4 border-transparent hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-transparent"
              >
                <ChevronLeft size={20} /> Prev
              </button>
              
              {currentQuestionIdx === questions.length - 1 ? (
                !isSubmitted ? (
                  <button 
                    onClick={submitHomework}
                    disabled={submitting || isOverdue}
                    className="bg-black text-white px-6 py-2 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all disabled:opacity-50"
                  >
                    {submitting ? '...' : 'Submit'}
                  </button>
                ) : (
                  <button onClick={() => navigate(`/dash/class/${classId}`)} className="bg-black text-white px-6 py-2 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Done
                  </button>
                )
              ) : (
                <button 
                  onClick={() => setCurrentQuestionIdx(p => Math.min(questions.length - 1, p + 1))}
                  className="flex items-center gap-1 font-black uppercase tracking-widest px-4 py-2 border-4 border-transparent hover:border-black transition-colors"
                >
                  Next <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
