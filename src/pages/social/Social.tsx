import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Users, Inbox, Check, X, Archive, ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Social() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userData } = useOutletContext<{ userData: any }>();
  const rollno = userData?.rollno;

  const [inbox, setInbox] = useState<any[]>([]);
  const [receivedReqs, setReceivedReqs] = useState<any[]>([]);
  const [sentReqs, setSentReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDrawer, setShowDrawer] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  const [showSendModal, setShowSendModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [targetUserData, setTargetUserData] = useState<any>(null);

  const startchatRollno = searchParams.get('startchat');
  const isFetching = useRef(false);
  const isFirstLoad = useRef(true);

  // Initial fetch + 2s polling
  useEffect(() => {
    if (!rollno) return;
    fetchData();

    const interval = setInterval(() => {
      if (!isFetching.current) {
        fetchData(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [rollno]);

  useEffect(() => {
    if (!startchatRollno || inbox.length === 0 && loading) return;

    // Check if chat already exists
    const existingChat = inbox.find(c => c.other_user_rollno === startchatRollno);
    if (existingChat) {
      // Clear URL and ideally open the chat in right column
      setSearchParams({});
      return;
    }

    // Check if request already sent or received
    const alreadySent = sentReqs.find(r => r.rollno === startchatRollno);
    if (alreadySent) {
      setSearchParams({});
      return; // Already requested
    }

    const alreadyReceived = receivedReqs.find(r => r.rollno === startchatRollno);
    if (alreadyReceived) {
      setShowDrawer(true);
      setSearchParams({});
      return; // Need to accept
    }

    // Otherwise, fetch target user to show modal
    fetch(`/api/public_profile?rollno=${startchatRollno}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setTargetUserData(d.data);
          setShowSendModal(true);
        }
      });
  }, [startchatRollno, inbox, sentReqs, receivedReqs, loading]);

  const fetchData = async (silent = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (!silent && isFirstLoad.current) setLoading(true);
    try {
      const [inboxRes, receivedRes, sentRes] = await Promise.all([
        fetch(`/api/users/${rollno}/inbox`).then(r => r.json()),
        fetch('/api/chat_requests?type=received').then(r => r.json()),
        fetch('/api/chat_requests?type=sent').then(r => r.json())
      ]);

      if (inboxRes.status === 'success') setInbox(inboxRes.data);
      if (receivedRes.status === 'success') setReceivedReqs(receivedRes.data);
      if (sentRes.status === 'success') setSentReqs(sentRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      isFetching.current = false;
      isFirstLoad.current = false;
    }
  };

  const parseMessage = (jsonStr: string) => {
    if (!jsonStr) return 'No messages yet';
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.text || 'Message';
    } catch {
      return jsonStr;
    }
  };

  const handleRequestAction = async (id: number, action: 'accept' | 'ignore') => {
    try {
      const res = await fetch(`/api/chat_requests/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData();
      } else {
        alert(data.message || `Failed to ${action} request`);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const toggleArchive = async (conversation_id: number, current_state: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversation_id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: !current_state })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendChatRequest = () => {
    if (!chatMessage.trim() || !targetUserData) return;
    setSendingRequest(true);
    fetch('/api/chat_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_user_rollno: targetUserData.rollno, message: chatMessage })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setShowSendModal(false);
        setChatMessage('');
        setSearchParams({});
        fetchData();
      } else {
        alert(data.message || 'Failed to send request');
      }
    })
    .finally(() => setSendingRequest(false));
  };

  const activeChats = inbox.filter(c => !c.is_archived);
  const archivedChats = inbox.filter(c => c.is_archived);
  const pendingReceived = receivedReqs.filter(r => r.status === 'pending');
  const ignoredReceived = receivedReqs.filter(r => r.status === 'ignored');

  return (
    <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-8rem)] min-h-[calc(100vh-8rem)] relative">
      {/* Left Column - People List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-h-[400px]">
        <div className="p-4 border-b-4 border-black bg-[#FFF5E1]">
          <h2 className="font-black uppercase tracking-widest text-xl mb-4">Inbox</h2>
          
          <button 
            onClick={() => navigate('/dash/social/discover')}
            className="w-full mb-3 flex items-center justify-center gap-2 bg-black text-white font-black uppercase tracking-widest border-4 border-black p-3 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-1 transition-all"
          >
            <Search size={18} />
            <span className="text-sm">Discover People</span>
          </button>

          <button 
            onClick={() => setShowDrawer(true)}
            className="w-full flex items-center justify-between bg-white text-black font-black uppercase tracking-widest border-4 border-black p-3 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-2">
              <Inbox size={18} />
              <span className="text-sm">Incoming Requests</span>
            </div>
            {pendingReceived.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 border-2 border-black">
                {pendingReceived.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center font-bold opacity-50 uppercase tracking-widest">Loading...</div>
          ) : (
            <div className="flex flex-col">
              {/* Active Chats */}
              {activeChats.length === 0 ? (
                <div className="p-8 text-center opacity-50 flex flex-col items-center">
                  <Users size={32} className="mb-2" />
                  <span className="font-bold text-sm uppercase tracking-widest">No active chats</span>
                </div>
              ) : (
                activeChats.map(chat => (
                  <div key={chat.conversation_id} className="flex items-center justify-between p-4 border-b-4 border-black hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <img src={chat.other_user_avatar || '/avatar-placeholder.png'} className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0" alt="Avatar" />
                      <div className="flex-1 min-w-0">
                        <div className="font-black truncate">{chat.other_user_name}</div>
                        <div className="text-xs font-bold text-gray-500 truncate">{parseMessage(chat.last_message)}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleArchive(chat.conversation_id, 0); }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 border-2 border-transparent hover:border-black transition-all"
                      title="Archive Chat"
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                ))
              )}

              {/* Archived Chats Collapsible */}
              {archivedChats.length > 0 && (
                <div className="border-t-4 border-black border-b-4">
                  <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 font-black uppercase tracking-widest text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Archive size={14} />
                      Archived ({archivedChats.length})
                    </div>
                    {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {showArchived && (
                    <div className="flex flex-col bg-gray-50">
                      {archivedChats.map(chat => (
                        <div key={chat.conversation_id} className="flex items-center justify-between p-4 border-t-2 border-gray-300 hover:bg-gray-200 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <img src={chat.other_user_avatar || '/avatar-placeholder.png'} className="w-10 h-10 rounded-full border-2 border-black opacity-75 object-cover shrink-0" alt="Avatar" />
                            <div className="flex-1 min-w-0 opacity-75">
                              <div className="font-black truncate">{chat.other_user_name}</div>
                              <div className="text-xs font-bold text-gray-500 truncate">{parseMessage(chat.last_message)}</div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleArchive(chat.conversation_id, 1); }}
                            className="p-2 bg-white border-2 border-black hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-xs font-black uppercase"
                          >
                            Unarchive
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sent Requests Collapsible */}
              {sentReqs.length > 0 && (
                <div className="border-b-4 border-black">
                  <button 
                    onClick={() => setShowSent(!showSent)}
                    className="w-full flex items-center justify-between p-3 bg-[#e0f2fe] hover:bg-[#bae6fd] font-black uppercase tracking-widest text-xs transition-colors text-[#0369a1]"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} />
                      Requested ({sentReqs.length})
                    </div>
                    {showSent ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {showSent && (
                    <div className="flex flex-col bg-white">
                      {sentReqs.map(req => (
                        <div key={req.id} className="p-4 border-t-2 border-blue-200 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <img src={req.avatar || '/avatar-placeholder.png'} className="w-8 h-8 rounded-full border-2 border-black object-cover shrink-0" alt="Avatar" />
                            <div className="font-black text-sm">{req.name}</div>
                            <div className="ml-auto text-[10px] font-bold uppercase bg-gray-200 px-2 py-1 border border-black">{req.status}</div>
                          </div>
                          <div className="text-xs font-bold bg-gray-50 p-2 border-l-4 border-blue-500">
                            {parseMessage(req.message)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Chat Area */}
      <div className="hidden md:flex flex-1 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <MessageSquare size={64} className="mx-auto mb-6 text-gray-300" />
          <h2 className="font-black text-3xl uppercase tracking-tighter mb-4 text-gray-400">Select a conversation</h2>
          <p className="font-bold text-sm text-gray-500">
            Choose a chat from the left or discover new people to connect with.
          </p>
        </motion.div>
      </div>

      {/* Incoming Requests Modal Popup */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b-4 border-black bg-yellow-300 flex items-center justify-between shrink-0">
                <h2 className="font-black uppercase tracking-widest text-xl">Incoming Requests</h2>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-4 flex flex-col gap-4">
                {pendingReceived.length === 0 ? (
                  <div className="text-center opacity-50 font-bold p-8 uppercase tracking-widest text-sm">No new requests</div>
                ) : (
                  pendingReceived.map(req => (
                    <div key={req.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={req.avatar || '/avatar-placeholder.png'} className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0" alt="Avatar" />
                        <div>
                          <div className="font-black text-lg leading-tight">{req.name}</div>
                          <Link to={`/public/${req.rollno}`} className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">View Profile</Link>
                        </div>
                      </div>
                      <div className="bg-gray-100 border-l-4 border-black p-3 mb-4 text-sm font-bold">
                        "{parseMessage(req.message)}"
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRequestAction(req.id, 'accept')}
                          className="flex-1 flex justify-center items-center gap-2 bg-[#3B82F6] text-white border-2 border-black py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          <Check size={14} /> Accept
                        </button>
                        <button 
                          onClick={() => handleRequestAction(req.id, 'ignore')}
                          className="flex-1 flex justify-center items-center gap-2 bg-gray-200 text-black border-2 border-black py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          <X size={14} /> Ignore
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Ignored Requests Collapsible inside Modal */}
                {ignoredReceived.length > 0 && (
                  <div className="mt-8 border-t-4 border-black pt-4">
                    <button 
                      onClick={() => setShowIgnored(!showIgnored)}
                      className="w-full flex items-center justify-between p-3 bg-gray-100 font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-gray-200 transition-colors"
                    >
                      <span>Ignored ({ignoredReceived.length})</span>
                      {showIgnored ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {showIgnored && (
                      <div className="mt-2 flex flex-col gap-2">
                        {ignoredReceived.map(req => (
                          <div key={req.id} className="p-3 border-2 border-gray-300 opacity-60 flex items-center gap-3">
                            <img src={req.avatar || '/avatar-placeholder.png'} className="w-8 h-8 rounded-full border border-black grayscale object-cover" alt="Avatar" />
                            <div className="font-bold text-sm truncate flex-1">{req.name}</div>
                            <button 
                              onClick={() => handleRequestAction(req.id, 'accept')}
                              className="bg-white border border-black px-2 py-1 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Request Modal */}
      <AnimatePresence>
        {showSendModal && targetUserData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Send Request</h3>
              <p className="text-sm font-bold mb-4">Introduce yourself to {targetUserData.name}. This message will start your conversation once they accept.</p>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Hi, I'd like to connect!"
                className="w-full h-32 border-4 border-black p-3 font-bold text-sm resize-none focus:outline-none focus:border-[#3B82F6] mb-4"
                maxLength={500}
              />
              <div className="text-right text-xs font-bold mb-6 text-gray-500">
                {chatMessage.length}/500
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSearchParams({});
                  }}
                  className="flex-1 bg-[#f4f4f5] border-4 border-black py-3 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={sendChatRequest}
                  disabled={sendingRequest || !chatMessage.trim()}
                  className="flex-1 bg-[#3B82F6] text-white border-4 border-black py-3 font-black uppercase tracking-widest disabled:opacity-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {sendingRequest ? 'Sending...' : 'Send'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
