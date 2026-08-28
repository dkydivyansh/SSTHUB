import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Maximize2, X, Paperclip, ExternalLink } from 'lucide-react';
import VisualEditor from '../components/VisualEditor';

type QuestionType = 'string' | 'single_select' | 'multi_select';

interface Question {
  id: string;
  text: string; 
  type: QuestionType;
  options: string[]; 
  correctAnswers: number[]; 
  stringAnswers?: string[];
  caseSensitive?: boolean;
}

export default function HomeworkCreatePage() {
  const { classId, homeworkId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Homework Data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [extraType, setExtraType] = useState<'none' | 'media' | 'assignment'>('none');
  const [fullScreenQuestionId, setFullScreenQuestionId] = useState<string | null>(null);
  
  // Assignment Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);

  useEffect(() => {
    // Load Google API scripts
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    document.body.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    document.body.appendChild(script2);
  }, []);

  useEffect(() => {
    if (homeworkId) {
      setLoading(true);
      fetch(`/api/homework/get?class_id=${classId}&homework_id=${homeworkId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            const hw = data.data;
            setTitle(hw.title === 'Untitled Homework Draft' ? '' : hw.title);
            setContent(hw.content || '');
            if (hw.expires_at) {
              // Convert to datetime-local format (YYYY-MM-DDTHH:mm)
              setDeadline(hw.expires_at.substring(0, 16));
            }
              if (hw.extras) {
                setExtraType(hw.extras.type || 'none');
                if (hw.extras.questions) {
                  setQuestions(hw.extras.questions);
                }
                if (hw.extras.attachments) {
                  setAttachments(hw.extras.attachments);
                }
              } else {
              setExtraType('none');
            }
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [classId, homeworkId]);

  const handleSave = async (status: 'draft' | 'published') => {
    let finalTitle = title.trim();
    
    if (status === 'published' && !finalTitle) {
      alert("Please enter a title before publishing.");
      return;
    }
    
    if (status === 'draft' && !finalTitle) {
      finalTitle = "Untitled Homework Draft";
    }

    setLoading(true);
    try {
      const payload: any = {
        class_id: classId,
        title: finalTitle,
        content,
        status,
        expires_at: deadline || null,
        extras: null
      };

      payload.extras = {
        type: extraType,
        questions: extraType === 'assignment' ? questions : [],
        attachments: attachments
      };

      const url = homeworkId ? '/api/homework/edit' : '/api/homework/create';
      if (homeworkId) {
        payload.homework_id = homeworkId;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.status === 'success') {
        navigate(`/faculty/class/${classId}`);
      } else {
        alert("Error saving: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save homework");
    } finally {
      setLoading(false);
    }
  };

  const handleDrivePicker = () => {
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
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(API_KEY)
            .setCallback((data: any) => {
              if (data.action === (window as any).google.picker.Action.PICKED) {
                const doc = data.docs[0];
                setAttachments(prev => [...prev, { name: doc.name, url: doc.url }]);
              }
            })
            .build();
          picker.setVisible(true);
        });
      },
    });
    tokenClient.requestAccessToken({ prompt: '' }); // allow immediate popup if already authorized
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Assignment Builder Helpers
  const addQuestion = (type: QuestionType) => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      text: '',
      type,
      options: type !== 'string' ? ['Option 1'] : [],
      correctAnswers: [],
      stringAnswers: type === 'string' ? [''] : [],
      caseSensitive: false
    }]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (qId: string, isStringAnswer: boolean = false) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (isStringAnswer) {
          return { ...q, stringAnswers: [...(q.stringAnswers || []), ''] };
        }
        return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const updateOption = (qId: string, index: number, val: string, isStringAnswer: boolean = false) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (isStringAnswer) {
          const newOpts = [...(q.stringAnswers || [])];
          newOpts[index] = val;
          return { ...q, stringAnswers: newOpts };
        }
        const newOpts = [...q.options];
        newOpts[index] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (qId: string, index: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (q.type === 'single_select') {
          return { ...q, correctAnswers: [index] };
        } else {
          const curr = [...q.correctAnswers];
          if (curr.includes(index)) {
            return { ...q, correctAnswers: curr.filter(i => i !== index) };
          } else {
            return { ...q, correctAnswers: [...curr, index] };
          }
        }
      }
      return q;
    }));
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FFF5E1] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b-4 border-black p-4 shadow-[0_4px_0_0_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/faculty/class/${classId}`)} className="text-black hover:text-purple-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter hidden sm:block">
            {homeworkId ? 'Edit Homework' : 'Create Homework'}
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            disabled={loading}
            onClick={() => handleSave('draft')}
            className="bg-white border-4 border-black px-4 py-2 font-black uppercase tracking-widest text-xs md:text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Save Draft
          </button>
          <button 
            disabled={loading}
            onClick={() => handleSave('published')}
            className="bg-black text-white border-4 border-black px-4 py-2 font-black uppercase tracking-widest text-xs md:text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8 mt-4">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm">
          <div className={`px-4 py-2 border-4 border-black ${step === 1 ? 'bg-purple-600 text-white' : 'bg-white text-gray-400'}`}>1. Basics</div>
          <div className="w-4 h-1 bg-black"></div>
          <div className={`px-4 py-2 border-4 border-black ${step === 2 ? 'bg-purple-600 text-white' : 'bg-white text-gray-400'}`}>2. Type</div>
          {extraType === 'assignment' && (
            <>
              <div className="w-4 h-1 bg-black"></div>
              <div className={`px-4 py-2 border-4 border-black ${step === 3 ? 'bg-purple-600 text-white' : 'bg-white text-gray-400'}`}>3. Builder</div>
            </>
          )}
        </div>

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-sm">Homework Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Quiz" 
                className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all text-lg" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-sm">Deadline (Optional)</label>
              <input 
                type="datetime-local" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)}
                className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="font-black uppercase tracking-widest text-sm">Content</label>
              <VisualEditor 
                value={content} 
                onChange={setContent} 
                placeholder="Write instructions here..." 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-sm flex items-center justify-between">
                <span>Attachments</span>
                <button 
                  onClick={handleDrivePicker}
                  className="flex items-center gap-1 text-purple-600 hover:underline text-xs"
                >
                  <Paperclip size={14} /> Add from Drive
                </button>
              </label>
              
              {attachments.length === 0 ? (
                <div className="border-4 border-black border-dashed p-6 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                  <span className="font-bold text-sm uppercase tracking-widest">No attachments</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between border-4 border-black p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-sm hover:text-purple-600 truncate mr-4">
                        <ExternalLink size={16} className="shrink-0" />
                        <span className="truncate">{att.name}</span>
                      </a>
                      <button onClick={() => removeAttachment(i)} className="text-red-500 hover:text-red-700 shrink-0">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setStep(2)}
              className="self-end bg-purple-600 text-white border-4 border-black px-8 py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {/* STEP 2: EXTRAS */}
        {step === 2 && (
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
            <h2 className="font-black uppercase tracking-tighter text-2xl">What type of homework is this?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setExtraType('none')}
                className={`flex flex-col items-center justify-center p-6 border-4 border-black transition-all ${extraType === 'none' ? 'bg-purple-100 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className="font-black uppercase tracking-widest text-lg">Standard</span>
                <span className="text-sm font-bold text-gray-500 mt-2 text-center">Just instructions and content. No automated questions.</span>
              </button>

              <button 
                onClick={() => setExtraType('assignment')}
                className={`flex flex-col items-center justify-center p-6 border-4 border-black transition-all ${extraType === 'assignment' ? 'bg-purple-100 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className="font-black uppercase tracking-widest text-lg">Interactive Assignment</span>
                <span className="text-sm font-bold text-gray-500 mt-2 text-center">Build a form with MCQs, checkboxes, and text inputs.</span>
              </button>
            </div>

            <div className="flex justify-between mt-4">
              <button 
                onClick={() => setStep(1)}
                className="bg-white text-black border-4 border-black px-6 py-2 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Back
              </button>
              
              {extraType === 'assignment' ? (
                <button 
                  onClick={() => setStep(3)}
                  className="bg-purple-600 text-white border-4 border-black px-8 py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Go To Builder
                </button>
              ) : (
                <button 
                  onClick={() => handleSave('published')}
                  className="bg-black text-white border-4 border-black px-8 py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all"
                >
                  Publish Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: BUILDER */}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 relative">
                <div className="absolute -top-4 -left-4 bg-purple-600 text-white w-8 h-8 flex items-center justify-center font-black border-4 border-black">
                  {index + 1}
                </div>
                
                <button 
                  onClick={() => removeQuestion(q.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-black uppercase tracking-widest text-xs">Question Text</label>
                    <button 
                      onClick={() => setFullScreenQuestionId(q.id)} 
                      className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-purple-600 hover:underline"
                    >
                      <Maximize2 size={14} /> Full Screen
                    </button>
                  </div>
                  <VisualEditor 
                    value={q.text} 
                    onChange={val => updateQuestion(q.id, { text: val })}
                    minHeight="100px"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">Question Type</label>
                  <select 
                    value={q.type}
                    onChange={e => {
                      const type = e.target.value as QuestionType;
                      updateQuestion(q.id, { 
                        type, 
                        options: type === 'string' ? [] : ['Option 1'],
                        correctAnswers: [],
                        stringAnswers: type === 'string' ? [''] : [],
                        caseSensitive: false
                      });
                    }}
                    className="border-2 border-black p-2 font-bold outline-none bg-white w-48"
                  >
                    <option value="string">Short Answer</option>
                    <option value="single_select">Single Select (Radio)</option>
                    <option value="multi_select">Multi Select (Checkbox)</option>
                  </select>
                </div>

                {(q.type === 'single_select' || q.type === 'multi_select') && (
                  <div className="flex flex-col gap-2 mt-4 bg-gray-50 p-4 border-2 border-black border-dashed">
                    <label className="font-black uppercase tracking-widest text-xs mb-2">Options (Select Correct Answers)</label>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleCorrectAnswer(q.id, oIndex)}
                          className={`w-6 h-6 border-2 border-black flex items-center justify-center transition-colors shrink-0 ${q.correctAnswers.includes(oIndex) ? 'bg-emerald-500 text-white' : 'bg-white'}`}
                        >
                          {q.correctAnswers.includes(oIndex) && <CheckCircle2 size={16} />}
                        </button>
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={e => updateOption(q.id, oIndex, e.target.value)}
                          className="flex-1 border-2 border-black p-1 font-bold outline-none" 
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => addOption(q.id)}
                      className="mt-2 text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-1 self-start hover:underline"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>
                )}

                {q.type === 'string' && (
                  <div className="flex flex-col gap-2 mt-4 bg-gray-50 p-4 border-2 border-black border-dashed">
                    <label className="font-black uppercase tracking-widest text-xs mb-2">Acceptable Correct Answers</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        id={`case-${q.id}`} 
                        checked={!q.caseSensitive} 
                        onChange={e => updateQuestion(q.id, { caseSensitive: !e.target.checked })} 
                        className="w-4 h-4"
                      />
                      <label htmlFor={`case-${q.id}`} className="text-xs font-bold uppercase tracking-widest">Not Case Sensitive (Default)</label>
                    </div>
                    {q.stringAnswers?.map((ans, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-black bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <input 
                          type="text" 
                          value={ans} 
                          onChange={e => updateOption(q.id, aIndex, e.target.value, true)}
                          placeholder="e.g. Artificial Intelligence"
                          className="flex-1 border-2 border-black p-1 font-bold outline-none" 
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => addOption(q.id, true)}
                      className="mt-2 text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-1 self-start hover:underline"
                    >
                      <Plus size={14} /> Add Alternative Answer
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-center gap-4 py-8 border-4 border-black border-dashed bg-white/50 backdrop-blur-sm">
              <button 
                onClick={() => addQuestion('string')}
                className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                + Short Answer
              </button>
              <button 
                onClick={() => addQuestion('single_select')}
                className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                + MCQ (Single)
              </button>
              <button 
                onClick={() => addQuestion('multi_select')}
                className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                + Checkboxes
              </button>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="bg-white text-black border-4 border-black px-6 py-2 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

      </div>

      {fullScreenQuestionId && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#FFF5E1] border-4 border-black w-full max-w-5xl h-full flex flex-col shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] relative">
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-white">
              <h2 className="font-black uppercase tracking-tighter text-xl">Edit Question Text</h2>
              <button 
                onClick={() => setFullScreenQuestionId(null)} 
                className="p-2 border-4 border-black bg-white hover:bg-red-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
              {(() => {
                const q = questions.find(q => q.id === fullScreenQuestionId);
                if (!q) return null;
                return (
                  <VisualEditor 
                    key={`fs-${q.id}-${fullScreenQuestionId}`}
                    value={q.text} 
                    onChange={val => updateQuestion(q.id, { text: val })} 
                    minHeight="100%" 
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
