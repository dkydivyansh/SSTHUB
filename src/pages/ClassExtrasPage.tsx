import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, RefreshCw, Users } from 'lucide-react';

export default function ClassExtrasPage() {
  const { classId } = useParams();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faculty/classes')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const found = data.data.find((c: any) => c.id === classId);
          if (found) {
            setClassData(found);
            document.title = `${found.name} Extras - SST Hub`;
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [classId]);

  const handleCopyLink = () => {
    // Generate full invite link
    const inviteLink = classData?.invitecode 
      ? `${window.location.origin}/dash/class?invite=${classData.invitecode}`
      : '';
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const handleResetLink = () => {
    // Dummy reset action
    alert('Invite link reset successfully (Mock action)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-black uppercase tracking-widest animate-pulse">Loading Extras...</div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="flex flex-col w-full h-full min-h-[60vh] gap-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black uppercase tracking-tighter text-black border-b-4 border-black pb-2">Class Extras</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invite Link Section */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <h2 className="font-black uppercase tracking-widest text-lg">Class Invite Link</h2>
          <p className="text-sm font-bold text-gray-600">Share this link with students to allow them to join your class.</p>
          
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={`${window.location.origin}/invite/${classId}-secret`}
              className="flex-1 border-2 border-black p-2 bg-gray-100 font-medium outline-none"
            />
            <button 
              onClick={handleCopyLink}
              className="bg-black text-white p-2 border-2 border-black hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(147,51,234,1)] transition-all"
              title="Copy Link"
            >
              <Copy size={20} />
            </button>
          </div>

          <button 
            onClick={handleResetLink}
            className="self-start flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600 hover:underline mt-2"
          >
            <RefreshCw size={14} /> Reset Invite Link
          </button>
        </div>

        {/* Member Count Section */}
        <div className="bg-purple-100 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-2">
          <Users size={48} className="text-purple-600" />
          <h2 className="font-black uppercase tracking-widest text-lg text-center mt-2">Total Joined Users</h2>
          <div className="text-5xl font-black tracking-tighter text-black">
            {classData.members_count || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
