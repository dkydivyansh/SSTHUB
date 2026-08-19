import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Users as UsersIcon, UserCog, ArrowLeft, Search, Filter, ShieldOff, CheckCircle, Clock, Info, Plus, Trash2, Edit, X } from 'lucide-react';

export default function AdminDashboard() {
  const { userData } = useOutletContext<any>();
  const location = useLocation();
  let activeTab = 'users';
  if (location.pathname.includes('/faculty')) activeTab = 'faculty';
  if (location.pathname.includes('/groups')) activeTab = 'groups';
  
  // -- USERS STATE --
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);

  const [disabledMsgPrompt, setDisabledMsgPrompt] = useState<{userId: number, name: string} | null>(null);
  const [disabledMsg, setDisabledMsg] = useState('');
  const [viewDisabledMsg, setViewDisabledMsg] = useState<{name: string, msg: string} | null>(null);

  // -- FACULTY STATE --
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [addFacultySearchQuery, setAddFacultySearchQuery] = useState('');
  const [addFacultySearchResults, setAddFacultySearchResults] = useState<any[]>([]);
  const [searchingAddFaculty, setSearchingAddFaculty] = useState(false);

  // -- GROUPS STATE --
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '', logo: '', type: 'public', admins: '' });
  const [manageAdminsGroup, setManageAdminsGroup] = useState<any | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<any[]>([]);
  const [searchingAdmins, setSearchingAdmins] = useState(false);

  // -- FETCHING LOGIC --
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

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await fetch(`/api/admin/groups?search=${encodeURIComponent(groupSearch)}`);
      const json = await res.json();
      if (json.status === 'success') {
        setGroups(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupsLoading(false);
    }
  }, [groupSearch]);

  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups();
    } else {
      fetchUsers();
    }
  }, [fetchUsers, fetchGroups, activeTab]);

  useEffect(() => {
    if (!adminSearchQuery || !manageAdminsGroup) {
      setAdminSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearchingAdmins(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(adminSearchQuery)}`);
        const json = await res.json();
        if (json.status === 'success') {
          setAdminSearchResults(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingAdmins(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [adminSearchQuery, manageAdminsGroup]);

  useEffect(() => {
    if (!addFacultySearchQuery || !showAddFaculty) {
      setAddFacultySearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearchingAddFaculty(true);
      try {
        // Only search members since we want to add them as faculty
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(addFacultySearchQuery)}&type=member`);
        const json = await res.json();
        if (json.status === 'success') {
          setAddFacultySearchResults(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingAddFaculty(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [addFacultySearchQuery, showAddFaculty]);

  if (userData?.type !== 'admin') {
    return <Navigate to="/dash" replace />;
  }

  // -- USER ACTIONS --
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

  const changeRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          target_user_id: userId,
          role: newRole
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        fetchUsers();
      } else {
        alert(json.message || 'Failed to update user role');
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

  // -- GROUP ACTIONS --
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminArray = newGroupData.admins.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newGroupData, admins: adminArray })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowCreateGroup(false);
        setNewGroupData({ name: '', description: '', logo: '', type: 'public', admins: '' });
        fetchGroups();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this group? All related events and announcements will be destroyed.')) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const json = await res.json();
      if (json.status === 'success') {
        fetchGroups();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAdmins = async () => {
    if (!manageAdminsGroup) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_admins', id: manageAdminsGroup.id, admins: manageAdminsGroup.admins })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setManageAdminsGroup(null);
        fetchGroups();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addAdmin = (id: number) => {
    if (!isNaN(id) && !manageAdminsGroup.admins.includes(id)) {
      setManageAdminsGroup({ ...manageAdminsGroup, admins: [...manageAdminsGroup.admins, id] });
    }
    setAdminSearchQuery('');
    setAdminSearchResults([]);
  };

  const removeAdmin = (id: number) => {
    setManageAdminsGroup({ ...manageAdminsGroup, admins: manageAdminsGroup.admins.filter((a: number) => a !== id) });
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto min-h-[80vh] relative">
      
      {/* Main Content Area */}
      {activeTab === 'groups' ? (
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center bg-[#f4f4f5] border-4 border-black p-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={20} />
              <input 
                type="text" 
                placeholder="Search groups by name..." 
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full bg-white border-4 border-black p-3 pl-10 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all"
              />
            </div>
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 bg-emerald-500 text-white border-4 border-black py-3 px-6 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-nowrap"
            >
              <Plus size={18} /> Create Group
            </button>
          </div>

          <div className="overflow-x-auto border-4 border-black">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-black text-white uppercase tracking-widest text-xs font-black">
                  <th className="p-4 border-r-4 border-black w-20 text-center">Logo</th>
                  <th className="p-4 border-r-4 border-black">Group Details</th>
                  <th className="p-4 border-r-4 border-black">Admins</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupsLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">Loading Data...</td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">No groups found</td>
                  </tr>
                ) : (
                  groups.map(g => (
                    <tr key={g.id} className="border-t-4 border-black hover:bg-[#f4f4f5] transition-colors">
                      <td className="p-4 border-r-4 border-black">
                        {g.logo ? (
                          <img src={g.logo} alt="Logo" className="w-12 h-12 border-2 border-black object-cover mx-auto bg-white" />
                        ) : (
                          <div className="w-12 h-12 border-2 border-black bg-emerald-100 flex items-center justify-center font-black text-emerald-800 mx-auto">
                            {g.name.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 border-r-4 border-black">
                        <div className="font-black uppercase text-lg">{g.name}</div>
                        <div className="text-xs font-bold text-gray-500 mb-2">ID: {g.id}</div>
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black ${g.type === 'private' ? 'bg-purple-500 text-white' : 'bg-emerald-300 text-black'}`}>
                          {g.type}
                        </span>
                      </td>
                      <td className="p-4 border-r-4 border-black font-bold">
                        {g.admins.length} Admins
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button 
                            onClick={() => setManageAdminsGroup(g)}
                            className="bg-blue-500 text-white border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                            title="Manage Admins"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(g.id)}
                            className="bg-red-500 text-white border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                            title="Delete Group"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
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
              {activeTab === 'faculty' && (
                <button 
                  onClick={() => setShowAddFaculty(true)}
                  className="flex items-center gap-2 bg-[#3B82F6] text-white border-4 border-black py-3 px-6 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-nowrap"
                >
                  <Plus size={18} /> Add Faculty
                </button>
              )}
            </div>
          </div>

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
                    <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">Loading Data...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-black uppercase tracking-widest border-t-4 border-black">No users found</td>
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
                          {u.type === 'member' && (
                            <button 
                              onClick={() => changeRole(u.userid, 'faculty')}
                              className="bg-blue-500 text-white border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                              title="Make Faculty"
                            >
                              <UserCog size={16} />
                            </button>
                          )}
                          {u.type === 'faculty' && (
                            <button 
                              onClick={() => changeRole(u.userid, 'member')}
                              className="bg-gray-500 text-white border-2 border-black p-2 hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform"
                              title="Remove Faculty Role"
                            >
                              <UserCog size={16} />
                            </button>
                          )}
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
      )}

      {/* --- MODALS --- */}

      {/* Disable User Modal */}
      {disabledMsgPrompt && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Create New Group</h3>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <input required type="text" placeholder="Group Name" value={newGroupData.name} onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all" />
              <textarea placeholder="Description" value={newGroupData.description} onChange={e => setNewGroupData({...newGroupData, description: e.target.value})} className="w-full border-4 border-black p-3 font-bold outline-none resize-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all h-24" />
              <input type="text" placeholder="Logo URI (optional)" value={newGroupData.logo} onChange={e => setNewGroupData({...newGroupData, logo: e.target.value})} className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all" />
              <select value={newGroupData.type} onChange={e => setNewGroupData({...newGroupData, type: e.target.value})} className="w-full border-4 border-black p-3 font-black uppercase tracking-widest outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all">
                <option value="public">Public Group</option>
                <option value="private">Private Group</option>
              </select>
              <input type="text" placeholder="Admin User IDs (comma separated)" value={newGroupData.admins} onChange={e => setNewGroupData({...newGroupData, admins: e.target.value})} className="w-full border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] transition-all" />
              
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 bg-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {manageAdminsGroup && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-blue-500">Manage Admins</h3>
            <p className="font-bold">Group: {manageAdminsGroup.name}</p>
            
            <div className="flex flex-col gap-2 relative">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search user by name, roll no, or ID..." 
                  value={adminSearchQuery} 
                  onChange={e => setAdminSearchQuery(e.target.value)} 
                  className="flex-1 border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all" 
                />
                <button 
                  onClick={() => addAdmin(parseInt(adminSearchQuery))}
                  className="bg-black text-white border-4 border-black px-4 font-black uppercase hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  title="Add directly by User ID"
                >
                  Add ID
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {(adminSearchResults.length > 0 || searchingAdmins) && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto z-10 flex flex-col">
                  {searchingAdmins ? (
                    <div className="p-3 font-bold text-center">Searching...</div>
                  ) : (
                    adminSearchResults.map(u => (
                      <button 
                        key={u.userid}
                        onClick={() => addAdmin(u.userid)}
                        className="flex justify-between items-center p-3 border-b-2 border-black hover:bg-blue-100 transition-colors text-left"
                      >
                        <div>
                          <div className="font-black uppercase">{u.name}</div>
                          <div className="text-xs font-bold text-gray-500">{u.rollno || u.email}</div>
                        </div>
                        <div className="text-xs font-black bg-black text-white px-2 py-1">ID: {u.userid}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {manageAdminsGroup.admins.map((id: number) => (
                <div key={id} className="flex items-center gap-2 bg-[#f4f4f5] border-4 border-black py-1 px-3 font-bold">
                  ID: {id}
                  <button onClick={() => removeAdmin(id)} className="text-red-500 hover:scale-110 transition-transform">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {manageAdminsGroup.admins.length === 0 && <span className="text-gray-500 italic">No admins assigned.</span>}
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={() => setManageAdminsGroup(null)} className="flex-1 bg-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
              <button onClick={handleUpdateAdmins} className="flex-1 bg-blue-500 text-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddFaculty && (
        <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#3B82F6]">Add Faculty</h3>
              <button onClick={() => { setShowAddFaculty(false); setAddFacultySearchQuery(''); setAddFacultySearchResults([]); }} className="hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <p className="font-bold text-sm text-gray-600">Search for a student/member to promote them to Faculty status.</p>
            
            <div className="flex flex-col gap-2 relative">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search user by name, roll no, or ID..." 
                  value={addFacultySearchQuery} 
                  onChange={e => setAddFacultySearchQuery(e.target.value)} 
                  className="flex-1 border-4 border-black p-3 font-bold outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all" 
                />
                <button 
                  onClick={() => {
                    const id = parseInt(addFacultySearchQuery);
                    if (!isNaN(id)) {
                      changeRole(id, 'faculty');
                      setShowAddFaculty(false);
                      setAddFacultySearchQuery('');
                      setAddFacultySearchResults([]);
                    }
                  }}
                  className="bg-black text-white border-4 border-black px-4 font-black uppercase hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-nowrap"
                  title="Add directly by User ID"
                >
                  Add ID
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {(addFacultySearchResults.length > 0 || searchingAddFaculty) && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto z-10 flex flex-col">
                  {searchingAddFaculty ? (
                    <div className="p-3 font-bold text-center">Searching...</div>
                  ) : (
                    addFacultySearchResults.map(u => (
                      <button 
                        key={u.userid}
                        onClick={() => {
                          changeRole(u.userid, 'faculty');
                          setShowAddFaculty(false);
                          setAddFacultySearchQuery('');
                          setAddFacultySearchResults([]);
                        }}
                        className="flex justify-between items-center p-3 border-b-2 border-black hover:bg-blue-100 transition-colors text-left"
                      >
                        <div>
                          <div className="font-black uppercase">{u.name}</div>
                          <div className="text-xs font-bold text-gray-500">{u.rollno || u.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] font-black bg-black text-white px-2 py-1">ID: {u.userid}</div>
                          <Plus size={16} className="text-blue-500" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <button onClick={() => { setShowAddFaculty(false); setAddFacultySearchQuery(''); setAddFacultySearchResults([]); }} className="w-full bg-white border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
