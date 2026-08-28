import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, X, CheckCircle2 } from 'lucide-react';

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchClasses = () => {
    fetch('/api/student/classes')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setClasses(data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'Classes - SST Hub';
    fetchClasses();
  }, []);

  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      setInviteLoading(true);
      fetch(`/api/class_invite_info?code=${inviteCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setInviteData({ ...data.data, code: inviteCode });
          } else {
            setInviteError(data.message || 'Invalid invite link.');
          }
        })
        .catch(() => setInviteError('Failed to load invite info.'))
        .finally(() => setInviteLoading(false));
    }
  }, [searchParams]);

  const handleJoinClass = async () => {
    if (!inviteData) return;
    setJoinLoading(true);
    setInviteError('');
    
    try {
      const res = await fetch('/api/join_class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitecode: inviteData.code })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setInviteData(null);
        searchParams.delete('invite');
        setSearchParams(searchParams);
        setLoading(true);
        fetchClasses(); // Refresh list
      } else {
        setInviteError(data.message || 'Failed to join class.');
      }
    } catch (err) {
      setInviteError('Network error while joining.');
    } finally {
      setJoinLoading(false);
    }
  };

  const closeInviteModal = () => {
    setInviteData(null);
    setInviteError('');
    searchParams.delete('invite');
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FFF5E1] p-4 md:p-8 max-w-7xl mx-auto gap-8">
      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black border-b-4 border-black pb-4">
        My Classes
      </h1>

      {classes.length === 0 ? (
        <div className="w-full bg-white border-4 border-black p-12 lg:p-24 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[40vh]">
          <div className="absolute top-4 left-4 w-4 h-4 bg-[#3B82F6] border-2 border-black rounded-none"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 bg-purple-600 border-2 border-black rounded-none"></div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
            NO <span className="text-purple-600">CLASSES</span> YET
          </h1>

          <p className="text-lg font-bold uppercase tracking-widest text-black/60 mt-8 border-t-4 border-black pt-8 max-w-xl">
            You haven't joined any classes yet. Ask your faculty for an invite link to join your first class!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link 
              key={cls.id} 
              to={`/dash/class/${cls.id}`} 
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(147,51,234,1)] transition-all flex flex-col gap-4 group"
            >
              <div className="w-16 h-16 bg-purple-100 border-4 border-black flex items-center justify-center shrink-0">
                {cls.logo ? (
                  <img src={cls.logo} alt={cls.name} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={32} className="text-purple-600" />
                )}
              </div>
              
              <div className="flex flex-col flex-1">
                <h3 className="font-black uppercase tracking-tighter text-xl line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {cls.name}
                </h3>
                {cls.description && (
                  <p className="text-sm font-bold text-gray-500 mt-2 line-clamp-3">
                    {cls.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {(inviteLoading || inviteData || inviteError) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closeInviteModal}
              className="absolute top-4 right-4 text-black hover:text-red-600 transition-colors z-10"
            >
              <X size={24} strokeWidth={3} />
            </button>

            {inviteLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="animate-spin text-black" />
                <span className="font-black uppercase tracking-widest text-sm">Loading Invite...</span>
              </div>
            ) : inviteError ? (
              <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-red-100 border-4 border-black flex items-center justify-center text-red-600 mb-2">
                  <X size={32} strokeWidth={3} />
                </div>
                <h2 className="font-black uppercase tracking-tighter text-2xl">Invite Failed</h2>
                <p className="font-bold text-gray-600">{inviteError}</p>
                <button 
                  onClick={closeInviteModal}
                  className="mt-4 bg-black text-white px-8 py-3 font-black uppercase tracking-widest hover:-translate-y-1 transition-transform border-4 border-black"
                >
                  Close
                </button>
              </div>
            ) : inviteData ? (
              <div className="flex flex-col">
                <div className="bg-[#FFF5E1] p-8 border-b-4 border-black flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/10 rounded-bl-full" />
                  
                  <div className="w-24 h-24 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 relative z-10">
                    {inviteData.logo ? (
                      <img src={inviteData.logo} alt="Class Logo" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={40} className="text-purple-600" />
                    )}
                  </div>
                  
                  <h2 className="font-black uppercase tracking-tighter text-3xl mb-2 relative z-10">
                    {inviteData.name}
                  </h2>
                  <span className="font-bold uppercase tracking-widest text-xs bg-purple-100 text-purple-800 px-3 py-1 border-2 border-purple-800">
                    Class Invitation
                  </span>
                </div>
                
                <div className="p-8 flex flex-col gap-6">
                  {inviteData.description && (
                    <div className="text-center">
                      <p className="font-bold text-gray-600 line-clamp-3">"{inviteData.description}"</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleJoinClass}
                    disabled={joinLoading}
                    className="w-full bg-purple-600 text-white border-4 border-black px-6 py-4 font-black uppercase tracking-widest text-lg hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                  >
                    {joinLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={24} />
                        Join Class
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
