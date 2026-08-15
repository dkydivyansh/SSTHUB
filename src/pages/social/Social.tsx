import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Users, Inbox, Check, X, Archive, ChevronRight, ChevronDown, Send, ArrowLeft, Trash, Ban, Image as ImageIcon, X as XIcon } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Social() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userData } = useOutletContext<{ userData: any }>();
  const rollno = userData?.rollno;
  const currentUserId = userData?.userid;

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

  // Chat state
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  
  const [attachments, setAttachments] = useState<{type: string, data: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startchatRollno = searchParams.get('startchat');
  const isFetching = useRef(false);
  const isFirstLoad = useRef(true);
  const isFetchingMessages = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCount = useRef(0);
  const lastSeenMsgIdRef = useRef<number | null>(null);

  // Initial fetch + 2s polling for inbox
  useEffect(() => {
    if (!rollno) return;
    fetchData();

    const interval = setInterval(() => {
      if (!isFetching.current) {
        fetchData(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [rollno]);

  // 1s polling for current chat messages
  useEffect(() => {
    if (!activeChat) return;
    fetchMessages();

    const interval = setInterval(() => {
      if (!isFetchingMessages.current) {
        fetchMessages(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeChat?.conversation_id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: messages.length - prevMessageCount.current > 5 ? 'auto' : 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!startchatRollno || inbox.length === 0 && loading) return;

    const existingChat = inbox.find(c => c.other_user_rollno === startchatRollno);
    if (existingChat) {
      setActiveChat(existingChat);
      setSearchParams({});
      return;
    }

    const alreadySent = sentReqs.find(r => r.rollno === startchatRollno);
    if (alreadySent) {
      setSearchParams({});
      return;
    }

    const alreadyReceived = receivedReqs.find(r => r.rollno === startchatRollno);
    if (alreadyReceived) {
      setShowDrawer(true);
      setSearchParams({});
      return;
    }

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

  const fetchMessages = async (silent = false) => {
    if (!activeChat || isFetchingMessages.current) return;
    isFetchingMessages.current = true;

    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/conversations/${activeChat.conversation_id}/messages?limit=100`);
      const data = await res.json();
      if (data.status === 'success') {
        // API returns DESC order, reverse for display (oldest first)
        const msgs = [...data.data].reverse();
        setMessages(msgs);

        if (msgs.length > 0) {
          const lastMsgId = msgs[msgs.length - 1].message_id;
          if (lastMsgId !== lastSeenMsgIdRef.current) {
            lastSeenMsgIdRef.current = lastMsgId;
            fetch(`/api/conversations/${activeChat.conversation_id}/seen`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message_id: lastMsgId })
            }).catch(() => {});
            
            setInbox(prev => prev.map(c => c.conversation_id === activeChat.conversation_id ? { ...c, unread_count: 0 } : c));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
      isFetchingMessages.current = false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 10) {
      alert('You can only attach a maximum of 10 images.');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 2MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAttachments(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, { type: 'image', data: ev.target!.result as string }];
          });
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !activeChat || sendingMessage) return;
    setSendingMessage(true);
    const msg = newMessage.trim();
    const currentAttachments = [...attachments];
    setNewMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Base64 encode to safely handle newlines and special characters in JSON
    let encodedMsg = '';
    if (msg) {
      encodedMsg = 'B64:' + btoa(unescape(encodeURIComponent(msg)));
    }

    try {
      const payload: any = { content: encodedMsg };
      if (currentAttachments.length > 0) {
        payload.media = currentAttachments;
      }

      const res = await fetch(`/api/conversations/${activeChat.conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        const fullPayload = { text: encodedMsg, media: currentAttachments };
        // Immediately add optimistic message
        setMessages(prev => [...prev, {
          message_id: data.data.message_id,
          content: JSON.stringify(fullPayload),
          sender_id: currentUserId,
          sender_name: userData?.name,
          sender_avatar: userData?.avatar,
          created_at: new Date().toISOString()
        }]);

        // Mark as seen immediately for the sent message
        lastSeenMsgIdRef.current = data.data.message_id;
        fetch(`/api/conversations/${activeChat.conversation_id}/seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: data.data.message_id })
        }).catch(() => {});
        
        setInbox(prev => {
          const newInbox = [...prev];
          const idx = newInbox.findIndex(c => c.conversation_id === activeChat.conversation_id);
          if (idx !== -1) {
            const chat = newInbox[idx];
            chat.last_message = JSON.stringify(fullPayload);
            chat.last_message_time = new Date().toISOString();
            chat.unread_count = 0;
            newInbox.splice(idx, 1);
            newInbox.unshift(chat);
          }
          return newInbox;
        });
      } else {
        setNewMessage(msg); // restore on failure
        setAttachments(currentAttachments);
        alert(data.message || 'Failed to send message');
      }
    } catch (e) {
      setNewMessage(msg);
      setAttachments(currentAttachments);
      alert('Network error');
    } finally {
      setSendingMessage(false);
    }
  };

  const parseMessageData = (jsonStr: string) => {
    if (!jsonStr) return { text: 'No messages yet', media: [], status: null };

    if (jsonStr.startsWith('B64:')) {
      try {
        return { text: decodeURIComponent(escape(atob(jsonStr.substring(4)))), media: [], status: null };
      } catch (e) {
        return { text: jsonStr, media: [], status: null };
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);
      let text = parsed.text || '';
      if (text.startsWith('B64:')) {
        try {
          text = decodeURIComponent(escape(atob(text.substring(4))));
        } catch (e) {}
      }
      return { 
        text, 
        media: parsed.media || [], 
        status: parsed.status 
      };
    } catch {
      return { text: jsonStr, media: [], status: null };
    }
  };

  const getPreviewText = (jsonStr: string) => {
    const data = parseMessageData(jsonStr);
    if (data.status === 'deleted') {
      return (
        <span className="italic text-gray-400 inline-flex items-center gap-1">
          <Ban size={12} className="shrink-0" /> This message was deleted
        </span>
      );
    }
    if (!data.text && data.media && data.media.length > 0) return '📸 Photo';
    return data.text;
  };

  const deleteMessage = async (messageId: number) => {
    if (!activeChat) return;
    try {
      const res = await fetch(`/api/conversations/${activeChat.conversation_id}/messages/${messageId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => prev.map(m => 
          m.message_id === messageId ? { ...m, content: JSON.stringify({ status: 'deleted' }) } : m
        ));
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (e) {
      alert('Network error while deleting');
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
    
    const encodedMsg = 'B64:' + btoa(unescape(encodeURIComponent(chatMessage.trim())));

    fetch('/api/chat_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_user_rollno: targetUserData.rollno, message: encodedMsg })
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

  const openChat = (chat: any) => {
    setActiveChat(chat);
    setMessages([]);
    prevMessageCount.current = 0;
    lastSeenMsgIdRef.current = null;
  };

  const closeChat = () => {
    setActiveChat(null);
    setMessages([]);
    prevMessageCount.current = 0;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeChats = inbox.filter(c => !c.is_archived);
  const archivedChats = inbox.filter(c => c.is_archived);
  const pendingReceived = receivedReqs.filter(r => r.status === 'pending');
  const ignoredReceived = receivedReqs.filter(r => r.status === 'ignored');

  return (
    <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-8rem)] min-h-[calc(100vh-8rem)] relative">
      {/* Left Column - People List */}
      <div className={`w-full md:w-1/3 flex flex-col bg-white md:border-4 md:border-black md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-h-[400px] ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b-4 border-black bg-[#FFF5E1]">
          <h2 className="font-black uppercase tracking-widest text-xl mb-4">Inbox</h2>
          <div className="flex flex-row gap-2">
            <button 
              onClick={() => navigate('/dash/social/discover')}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-black text-white font-black uppercase tracking-widest border-4 border-black p-2 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-1 transition-all"
            >
              <Search size={18} />
              <span className="text-[10px] md:text-sm text-center">Discover</span>
            </button>

            <button 
              onClick={() => setShowDrawer(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-white text-black font-black uppercase tracking-widest border-4 border-black p-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all relative"
            >
              <Inbox size={18} />
              <span className="text-[10px] md:text-sm text-center">Requests</span>
              {pendingReceived.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 border-2 border-black">
                  {pendingReceived.length}
                </span>
              )}
            </button>
          </div>
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
                  <div 
                    key={chat.conversation_id} 
                    onClick={() => openChat(chat)}
                    className={`flex items-center justify-between p-4 border-b-4 border-black hover:bg-gray-50 transition-colors group cursor-pointer ${activeChat?.conversation_id === chat.conversation_id ? 'bg-[#e0f2fe]' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <img src={chat.other_user_avatar || '/avatar-placeholder.png'} className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0" alt="Avatar" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 max-w-full">
                          <div className="font-black truncate min-w-0 flex-shrink">{chat.other_user_name}</div>
                          <div className="font-bold text-[9px] uppercase text-gray-500 bg-gray-200 px-1 border border-black whitespace-nowrap flex-shrink-0">
                            {chat.other_user_rollno}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 truncate">{getPreviewText(chat.last_message)}</div>
                      </div>
                    </div>
                    {chat.unread_count > 0 && activeChat?.conversation_id !== chat.conversation_id && (
                      <div className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.5 border-2 border-black whitespace-nowrap ml-2 mr-2">
                        {chat.unread_count > 99 ? '99+' : chat.unread_count}
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleArchive(chat.conversation_id, 0); }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 hover:bg-gray-200 border-2 border-transparent hover:border-black transition-all"
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
                        <div 
                          key={chat.conversation_id} 
                          onClick={() => openChat(chat)}
                          className="flex items-center justify-between p-4 border-t-2 border-gray-300 hover:bg-gray-200 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            <img src={chat.other_user_avatar || '/avatar-placeholder.png'} className="w-10 h-10 rounded-full border-2 border-black opacity-75 object-cover shrink-0" alt="Avatar" />
                            <div className="flex-1 min-w-0 opacity-75">
                              <div className="flex items-center gap-2 max-w-full">
                                <div className="font-black truncate min-w-0 flex-shrink">{chat.other_user_name}</div>
                                <div className="font-bold text-[9px] uppercase text-gray-500 bg-gray-200 px-1 border border-black whitespace-nowrap flex-shrink-0">
                                  {chat.other_user_rollno}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-gray-500 truncate">{getPreviewText(chat.last_message)}</div>
                            </div>
                          </div>
                          {chat.unread_count > 0 && activeChat?.conversation_id !== chat.conversation_id && (
                            <div className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.5 border-2 border-black whitespace-nowrap ml-2 mr-2">
                              {chat.unread_count > 99 ? '99+' : chat.unread_count}
                            </div>
                          )}
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
                            {getPreviewText(req.message)}
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
      <div className={`bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-col min-h-[400px] ${activeChat ? 'fixed inset-0 z-[60] md:static md:flex-1 flex border-0 md:border-4 shadow-none md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'hidden md:flex flex-1'}`}>
        {activeChat ? (
          /* Active Chat View */
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b-4 border-black bg-[#FFF5E1] flex items-center gap-3 shrink-0">
              <button 
                onClick={closeChat}
                className="p-2 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                <ArrowLeft size={18} className="md:hidden" />
                <X size={18} className="hidden md:block" />
              </button>
              <img 
                src={activeChat.other_user_avatar || '/avatar-placeholder.png'} 
                className="w-10 h-10 rounded-full border-2 border-black object-cover shrink-0" 
                alt="Avatar" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 max-w-full">
                  <div className="font-black truncate text-base md:text-lg min-w-0 flex-shrink">{activeChat.other_user_name}</div>
                  <div className="font-bold text-[10px] md:text-xs uppercase bg-black text-white px-1.5 py-0.5 border border-black whitespace-nowrap flex-shrink-0">
                    {activeChat.other_user_rollno}
                  </div>
                </div>
                <Link to={`/u/${activeChat.other_user_rollno}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">
                  View Profile
                </Link>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 bg-[#fafafa]">
              {chatLoading && messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="font-bold opacity-50 uppercase tracking-widest text-sm">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center opacity-50">
                    <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
                    <div className="font-bold text-sm uppercase tracking-widest">No messages yet</div>
                    <div className="font-bold text-xs text-gray-400 mt-1">Send a message to start the conversation.</div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender_id) === String(currentUserId);
                  const parsedMsg = parseMessageData(msg.content);
                  return (
                    <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div 
                          className={`border-2 border-black p-2 md:p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isMine ? 'bg-[#3B82F6] text-white' : 'bg-white text-black'} relative group cursor-pointer md:cursor-default`}
                          onClick={() => {
                            if (window.innerWidth < 768 && isMine && !msg.content?.includes('"status":"deleted"')) {
                              setSelectedMessageId(prev => prev === msg.message_id ? null : msg.message_id);
                            }
                          }}
                        >
                          <div className="font-bold text-sm break-words whitespace-pre-wrap">
                            {parsedMsg.status === 'deleted' ? getPreviewText(msg.content) : parsedMsg.text}
                          </div>
                          {parsedMsg.media && parsedMsg.media.length > 0 && parsedMsg.status !== 'deleted' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {parsedMsg.media.map((m: any, i: number) => (
                                <img key={i} src={m.data} alt="attachment" className="max-w-[200px] max-h-[200px] border-2 border-black object-contain bg-black" />
                              ))}
                            </div>
                          )}
                          <div className={`text-[10px] font-bold mt-1 ${isMine ? 'text-white/60 text-right' : 'text-black/40'}`}>
                            {formatTime(msg.created_at)}
                          </div>
                          {isMine && !msg.content?.includes('"status":"deleted"') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteMessage(msg.message_id); }}
                              className={`absolute top-[-10px] right-[-10px] bg-red-500 text-white p-1 border-2 border-black rounded-full transition-all hover:scale-110 ${selectedMessageId === msg.message_id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                              title="Delete Message"
                            >
                              <Trash size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="p-2 bg-gray-100 border-t-4 border-black flex gap-2 overflow-x-auto shrink-0">
                {attachments.map((att, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={att.data} className="h-16 w-16 object-cover border-2 border-black" alt="preview" />
                    <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-black">
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message Input - sticky bottom on mobile */}
            <div className="p-2 md:p-3 border-t-4 border-black bg-white shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2 items-end"
              >
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-gray-200 h-[44px] md:h-[52px] border-4 border-black px-3 md:px-4 text-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0 flex items-center justify-center">
                  <ImageIcon size={20} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border-4 border-black p-2 md:p-3 font-bold text-sm focus:outline-none focus:border-[#3B82F6] transition-colors resize-none max-h-32 min-h-[44px] md:min-h-[52px]"
                  rows={1}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-[#3B82F6] h-[44px] md:h-[52px] text-white border-4 border-black px-3 md:px-4 font-black uppercase disabled:opacity-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0 flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-8 text-center">
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
        )}
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
                        "{getPreviewText(req.message)}"
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
