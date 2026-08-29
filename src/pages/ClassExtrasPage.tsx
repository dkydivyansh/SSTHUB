import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, RefreshCw, Users } from 'lucide-react';

export default function ClassExtrasPage() {
  const { classId } = useParams();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetch('/api/faculty/classes')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const found = data.data.find((c: any) => c.id === classId);
          if (found) {
            setClassData(found);
            setEditData({ name: found.name || '', description: found.description || '' });
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

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/update_class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          class_id: classId,
          name: editData.name,
          description: editData.description
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setClassData({ ...classData, name: editData.name, description: editData.description });
        alert('Class details updated successfully!');
      } else {
        alert(data.message || 'Error updating class');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setSaving(false);
    }
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

        {/* Edit Details Section */}
        <div className="md:col-span-2 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <h2 className="font-black uppercase tracking-widest text-lg border-b-4 border-black pb-2 mb-2">Class Settings</h2>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-widest text-sm">Class Name</label>
            <input 
              type="text" 
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold uppercase tracking-widest text-sm">Description (Optional)</label>
            <textarea 
              value={editData.description}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
              rows={3}
              className="w-full border-4 border-black p-3 font-medium outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all"
            />
          </div>

          <div className="flex justify-end mt-2">
            <button 
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white border-4 border-black font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
