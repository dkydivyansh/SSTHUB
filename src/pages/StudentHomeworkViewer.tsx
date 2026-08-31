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
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Media State
  const [files, setFiles] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Custom Modal State
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; isConfirm?: boolean; onConfirm?: () => void }>({ isOpen: false, title: '', message: '' });

  const showInfo = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, isConfirm: false });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalState({ isOpen: true, title, message, isConfirm: true, onConfirm });
  };

  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  useEffect(() => {
    // Load Google Picker API scripts
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    document.body.appendChild(script2);

    fetch(`/api/homework/get?class_id=${classId}&homework_id=${homeworkId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setHw(data.data);
          document.title = `${data.data.title} - SST Hub`;
          
          if (data.data.user_submission) {
            setAnswers(data.data.user_submission.answers || {});
            setFiles(data.data.user_submission.files || []);
          }
        } else {
          setError('Failed to load homework');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      if (document.body.contains(script1)) document.body.removeChild(script1);
      if (document.body.contains(script2)) document.body.removeChild(script2);
    };
  }, [classId, homeworkId]);

  const isSubmitted = !!hw?.user_submission;
  const isOverdue = hw?.expires_at && new Date(hw.expires_at) < new Date();
  const canSubmit = !isSubmitted && (!isOverdue);

  const handleDriveUpload = () => {
    const API_KEY = 'AIzaSyDoqhA63ZGJ2PArFx5rJ7uhxcpaFlUlVjg';
    const CLIENT_ID = '395027667845-rnn22t43fi63jqoj6muqalemp1gt0ugs.apps.googleusercontent.com';
    
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error !== undefined) {
          throw tokenResponse;
        }
        (window as any).gapi.load('picker', () => {
          const picker = new (window as any).google.picker.PickerBuilder()
            .addView((window as any).google.picker.ViewId.DOCS)
            .addView(new (window as any).google.picker.DocsUploadView())
            .enableFeature((window as any).google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(API_KEY)
            .setAppId('395027667845')
            .setCallback(async (data: any) => {
              if (data.action === (window as any).google.picker.Action.PICKED) {
                const newFiles = data.docs.map((doc: any) => ({ name: doc.name, url: doc.url }));
                setFiles(prev => [...prev, ...newFiles]);
                
                // Automatically make the uploaded files public so others can view them
                for (const doc of data.docs) {
                  try {
                    const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}/permissions`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${tokenResponse.access_token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ type: 'anyone', role: 'reader' })
                    });
                    
                    if (!permRes.ok) {
                      const errorData = await permRes.json();
                      console.error("Permission update failed:", errorData);
                      showInfo('Warning', `We couldn't automatically make "${doc.name}" public. Your teacher might not be able to view it. Please ensure the file's sharing settings in Google Drive allow anyone with the link to view it.`);
                    }
                  } catch (e) {
                    console.error("Failed to update file permissions automatically", e);
                    showInfo('Warning', `A network error occurred while trying to update permissions for "${doc.name}". Please check the sharing settings manually.`);
                  }
                }
              }
            })
            .build();
          picker.setVisible(true);
        });
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submitHomework = () => {
    if (isOverdue) {
      showInfo('Deadline Passed', 'The deadline for this assignment has passed. Submissions are no longer accepted.');
      return;
    }

    let type = hw?.extras?.type || 'media';
    if (type === 'none') type = 'media';

    if (type === 'media' && files.length === 0) {
      showInfo('Submission Error', 'Please attach at least one file before submitting your work.');
      return;
    }

    showConfirm('Submit Homework', 'Are you sure you want to turn in your work?', async () => {
      setSubmitting(true);
      
      let submissionData = {};
      
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
          showInfo('Success', 'Homework submitted successfully!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showInfo('Error', data.message || 'Error submitting homework');
        }
      } catch (err) {
        showInfo('Error', 'A network error occurred while submitting.');
      } finally {
        setSubmitting(false);
      }
    });
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

  let type = hw.extras?.type || 'media';
  if (type === 'none') type = 'media';
  const questions = hw.extras?.questions || [];

  return (
    <div className="flex flex-col min-h-screen bg-white sm:bg-[#FFF5E1]">
      {/* Top Header */}
      <div className="bg-white border-b-4 border-black p-3 sm:p-4 flex items-start sm:items-center justify-between">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button onClick={() => navigate(`/dash/class/${classId}`)} className="p-2 border-2 border-black hover:bg-purple-100 transition-colors shrink-0 mt-1 sm:mt-0">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="font-black uppercase tracking-tighter text-lg sm:text-2xl break-words whitespace-normal leading-tight">{hw.title}</h1>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
              {isSubmitted ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Turned In</span>
                  {hw.submitted_at && (
                    <span className="text-gray-400 text-[10px] sm:text-xs tracking-normal normal-case">
                      {new Date(hw.submitted_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
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

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-0 sm:p-4 md:p-8">
        
        {/* MEDIA TYPE: STEP 1 (Instructions) */}
        {type === 'media' && step === 1 && (
          <div className="flex flex-col gap-4 sm:gap-8 flex-1">
            <div className="bg-white sm:border-4 sm:border-black p-4 sm:p-6 sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-b-4 border-black flex-1">
              {hw.content && hw.content.trim() !== '' ? (
                <div 
                  className="font-medium text-base prose-img:max-w-full prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6"
                  dangerouslySetInnerHTML={{ __html: hw.content }}
                />
              ) : (
                <p className="text-gray-500 font-bold italic">No instructions provided.</p>
              )}

              {hw.extras?.attachments && hw.extras.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t-4 border-black">
                  <h3 className="font-black uppercase tracking-widest text-sm mb-4">Attachments</h3>
                  <div className="flex flex-col gap-3">
                    {hw.extras.attachments.map((att: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border-2 border-black bg-purple-50 hover:bg-purple-100 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all group"
                      >
                        <File size={20} className="text-purple-600 shrink-0" />
                        <span className="font-bold text-sm truncate group-hover:underline">{att.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-4 sm:p-0">
              <button 
                onClick={() => setStep(2)}
                className="bg-purple-600 text-white px-8 py-3 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* MEDIA TYPE: STEP 2 (Upload UI) */}
        {type === 'media' && step === 2 && (
          <div className="flex flex-col gap-4 sm:gap-6 flex-1 sm:flex-none">
            <div className="flex justify-start px-4 sm:px-0">
               <button 
                 onClick={() => setStep(1)}
                 className="flex items-center gap-1 font-black uppercase tracking-widest hover:text-purple-600 transition-colors"
               >
                 <ArrowLeft size={16} /> Back to Instructions
               </button>
            </div>
            <div className="bg-white sm:border-4 sm:border-black p-4 sm:p-6 sm:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] flex flex-col gap-4 sm:gap-6">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-2">Your Work</h2>
            
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
                disabled={submitting}
                className="w-full bg-black text-white p-4 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {submitting ? 'Submitting...' : 'Turn In Homework'}
              </button>
            )}
          </div>
        </div>
        )}

        {/* Assignment Type UI (Quiz) */}
        {type === 'assignment' && questions.length > 0 && (
          <div className="bg-white sm:border-4 sm:border-black sm:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] flex flex-col flex-1 sm:h-[500px] h-full border-t-4 border-black sm:border-t-4">
            {/* Quiz Header */}
            <div className="bg-purple-600 text-white p-3 sm:p-4 border-b-4 border-black flex items-center justify-between">
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
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div 
                className="whitespace-pre-wrap text-lg sm:text-2xl font-black uppercase tracking-tighter mb-6 sm:mb-8 [&_b]:font-black [&_i]:italic [&_s]:line-through [&_ul]:list-disc [&_ul]:pl-6 sm:[&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-6 sm:[&_ol]:pl-8 [&_img]:max-w-full [&_img]:border-4 [&_img]:border-black [&_img]:my-4"
                dangerouslySetInnerHTML={{ __html: questions[currentQuestionIdx].text }}
              />
              
              <div className="flex flex-col gap-3 sm:gap-4">
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
                    disabled={submitting}
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
      
      {/* Custom Popup Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white border-4 border-black w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] flex flex-col">
            <div className="p-6 text-center flex flex-col gap-4">
              <h3 className="font-black uppercase tracking-tighter text-2xl">{modalState.title}</h3>
              <p className="font-bold text-gray-700">{modalState.message}</p>
            </div>
            <div className="flex border-t-4 border-black">
              {modalState.isConfirm && (
                <button 
                  onClick={closeModal}
                  className="flex-1 p-4 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors border-r-4 border-black"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if (modalState.isConfirm && modalState.onConfirm) {
                    modalState.onConfirm();
                  }
                  closeModal();
                }}
                className="flex-1 p-4 bg-black text-white font-black uppercase tracking-widest hover:bg-purple-600 transition-colors"
              >
                {modalState.isConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
