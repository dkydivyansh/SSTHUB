import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Navigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Users as UsersIcon, UserCog, ArrowLeft, Search, Filter, ShieldOff, CheckCircle, Clock, Info } from 'lucide-react';

export default function AdminDashboard() {
  const { userData } = useOutletContext<any>();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';
  
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);

  const [disabledMsgPrompt, setDisabledMsgPrompt] = useState<{userId: number, name: string} | null>(null);
  const [disabledMsg, setDisabledMsg] = useState('');
  const [viewDisabledMsg, setViewDisabledMsg] = useState<{name: string, msg: string} | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const typeToFetch = activeTab === 'faculty' ? 'faculty' : filterType;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (typeToFetch) params.append('type', typeToFetch);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setUsers(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (userData?.type !== 'admin') {
    return <Navigate to="/dash" replace />;
  }

  const changeStatus = async (userId: number, newStatus: string, msg: string = '') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          target_user_id: userId,
          status: newStatus,
          disabledmsg: msg
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        fetchUsers();
      } else {
        alert(json.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabledMsgPrompt) {
      changeStatus(disabledMsgPrompt.userId, 'disabled', disabledMsg);
      setDisabledMsgPrompt(null);
      setDisabledMsg('');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto min-h-[80vh] relative">
      
      {/* Main Content Area */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-[#f4f4f5] border-4 border-black p-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, roll no, or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-4 border-black p-3 pl-10 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border-4 border-black p-3 font-black uppercase tracking-widest text-xs outline-none cursor-pointer focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>

            {activeTab === 'users' && (
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border-4 border-black p-3 font-black uppercase tracking-widest text-xs outline-none cursor-pointer focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
              >
                <option value="">All Types</option>
                <option value="member">Student / Member</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="overflow-x-auto border-4 border-black">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black text-white uppercase tracking-widest text-xs font-black">
                <th className="p-4 border-r-4 border-black">User</th>
                <th className="p-4 border-r-4 border-black">Contact</th>
                <th className="p-4 border-r-4 border-black">Role / Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">
                    Loading Data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.userid} className="border-t-4 border-black hover:bg-[#f4f4f5] transition-colors">
                    <td className="p-4 border-r-4 border-black">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" className="w-10 h-10 border-2 border-black object-cover rounded-none" />
                        ) : (
                          <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                        )}
                        <div>
                          <div className="font-black uppercase">{u.name}</div>
                          {u.rollno && <div className="text-xs font-bold text-gray-600">{u.rollno}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r-4 border-black text-sm font-bold">
                      {u.email}
                    </td>
                    <td className="p-4 border-r-4 border-black">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black ${u.type === 'admin' ? 'bg-red-500 text-white' : u.type === 'faculty' ? 'bg-[#3B82F6] text-white' : 'bg-white'}`}>
                          {u.type}
                        </span>
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black flex items-center gap-1 ${u.status === 'active' ? 'bg-green-400 text-black' : u.status === 'pending' ? 'bg-yellow-400 text-black' : 'bg-gray-400 text-white'}`}>
                          {u.status === 'active' ? <CheckCircle size={10} /> : u.status === 'pending' ? <Clock size={10} /> : <ShieldOff size={10} />}
                          {u.status}
                          {u.status === 'disabled' && u.disabledmsg && (
                            <button 
                              onClick={() => setViewDisabledMsg({name: u.name, msg: u.disabledmsg})}
                              className="ml-1 hover:text-black transition-colors"
                              title="View Reason"
                            >
                              <Info size={12} />
                            </button>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {u.status !== 'active' && (
                          <button 
                            onClick={() => changeStatus(u.userid, 'active')}
                            className="bg-green-400 text-black border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                            title="Set Active"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {u.status !== 'pending' && (
                          <button 
                            onClick={() => changeStatus(u.userid, 'pending')}
                            className="bg-yellow-400 text-black border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                            title="Set Pending"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                        {u.status !== 'disabled' && (
                          <button 
                            onClick={() => setDisabledMsgPrompt({userId: u.userid, name: u.name})}
                            className="bg-red-500 text-white border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                            title="Disable Account"
                          >
                            <ShieldOff size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Disable Message Modal */}
      {disabledMsgPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">Disable User</h3>
            <p className="font-bold">Provide a reason for disabling <strong>{disabledMsgPrompt.name}</strong>'s account. This message will be shown to them.</p>
            
            <form onSubmit={handleDisableSubmit} className="flex flex-col gap-4">
              <textarea 
                required
                placeholder="e.g. Violation of community guidelines..."
                value={disabledMsg}
                onChange={(e) => setDisabledMsg(e.target.value)}
                className="w-full h-32 border-4 border-black p-3 font-bold outline-none resize-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] transition-all"
              />
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => { setDisabledMsgPrompt(null); setDisabledMsg(''); }}
                  className="flex-1 bg-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-red-500 text-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Disabled Message Modal */}
      {viewDisabledMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">Disabled Reason</h3>
            <p className="font-bold">Message left for <strong>{viewDisabledMsg.name}</strong>:</p>
            <div className="bg-[#f4f4f5] border-4 border-black p-4 font-bold whitespace-pre-wrap">
              {viewDisabledMsg.msg}
            </div>
            <button 
              onClick={() => setViewDisabledMsg(null)}
              className="w-full bg-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
