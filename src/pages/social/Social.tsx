import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Users, Inbox, Check, X, Archive, ChevronRight, ChevronDown, Send, ArrowLeft, Trash, Ban, Image as ImageIcon, X as XIcon, Paperclip, Video, Music, FileText, Download, Play, ExternalLink, Smile, Reply } from 'lucide-react';
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
  type LightboxMedia = {
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    name?: string;
  };
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ message_id: number, text: string } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);

  const closeAllMenus = () => {
    setShowAttachMenu(false);
    setSelectedMessageId(null);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  const handleOpenDocument = async () => {
    if (!lightboxMedia) return;
    try {
      const res = await fetch(lightboxMedia.url);
      const blob = await res.blob();

      let mimeType = blob.type;
      const lowerName = (lightboxMedia.name || '').toLowerCase();
      if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (lowerName.endsWith('.txt')) mimeType = 'text/plain';

      const properBlob = new Blob([blob], { type: mimeType });
      const blobUrl = URL.createObjectURL(properBlob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      showError('Failed to open document preview');
    }
  };

  const [attachments, setAttachments] = useState<any[]>([]);
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

  // Initial fetch + 5s polling for inbox
  useEffect(() => {
    if (!currentUserId) return;
    fetchData();

    const interval = setInterval(() => {
      if (!isFetching.current) {
        fetchData(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Dynamic Title
  useEffect(() => {
    if (activeChat) {
      document.title = `${activeChat.other_user_name} - Chat - SST Hub`;
    } else {
      document.title = 'Messages - SST Hub';
    }
  }, [activeChat]);

  // 1s polling for current chat messages
  useEffect(() => {
    if (!activeChat) {
      document.body.classList.remove('chat-open');
      return;
    }
    document.body.classList.add('chat-open');
    fetchMessages();

    const interval = setInterval(() => {
      if (!isFetchingMessages.current) {
        fetchMessages(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.body.classList.remove('chat-open');
    };
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
        fetch(`/api/inbox`).then(r => r.json()),
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
            }).catch(() => { });

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
      showError('You can only attach a maximum of 10 files.');
      return;
    }

    files.forEach(file => {
      // 50MB limit
      if (file.size > 50 * 1024 * 1024) {
        showError(`File ${file.name} is larger than 50MB.`);
        return;
      }

      const id = Math.random().toString(36).substring(7);

      // Hybrid logic: If < 2MB and it's an image, use base64
      if (file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setAttachments(prev => {
              if (prev.length >= 10) return prev;
              return [...prev, {
                id,
                file,
                previewUrl: ev.target!.result as string,
                isBase64: true,
                base64Data: ev.target!.result as string,
                progress: 100
              }];
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Chunked upload needed
        setAttachments(prev => {
          if (prev.length >= 10) return prev;
          return [...prev, {
            id,
            file,
            previewUrl: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '',
            isBase64: false,
            progress: 0
          }];
        });
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const uploadFileInChunks = async (file: File, conversation_id: number, onProgress: (p: number) => void) => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file_uuid', fileUuid);
      formData.append('chunk_index', i.toString());
      formData.append('total_chunks', totalChunks.toString());
      formData.append('conversation_id', conversation_id.toString());
      formData.append('original_name', file.name);
      formData.append('mime_type', file.type || 'application/octet-stream');
      formData.append('chunk', chunk);

      const res = await fetch('/api/upload_chunk', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Upload failed');
      }
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
    return fileUuid;
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !activeChat || sendingMessage) return;
    setSendingMessage(true);
    const msg = newMessage.trim();
    const currentAttachments = [...attachments];

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const mediaPayload = [];
      // Process attachments
      for (let i = 0; i < currentAttachments.length; i++) {
        const att = currentAttachments[i];
        if (att.isBase64) {
          mediaPayload.push({ type: 'image', data: att.base64Data });
        } else {
          // Upload chunks
          const uuid = await uploadFileInChunks(att.file, activeChat.conversation_id, (progress) => {
            setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, progress } : a));
          });
          mediaPayload.push({
            type: 'attachment',
            uuid: uuid,
            mime_type: att.file.type || 'application/octet-stream',
            original_name: att.file.name
          });
        }
      }

      setNewMessage('');
      setAttachments([]);

      // Base64 encode text
      let encodedMsg = '';
      if (msg) {
        encodedMsg = 'B64:' + btoa(unescape(encodeURIComponent(msg)));
      }

      const payload: any = { content: encodedMsg };
      if (mediaPayload.length > 0) {
        payload.media = mediaPayload;
      }
      if (replyingTo) {
        payload.reply_to = replyingTo;
      }

      const res = await fetch(`/api/conversations/${activeChat.conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        const fullPayload = { text: encodedMsg, media: mediaPayload, reply_to: replyingTo };
        setMessages(prev => [...prev, {
          message_id: data.data.message_id,
          content: JSON.stringify(fullPayload),
          sender_id: currentUserId,
          sender_name: userData?.name,
          sender_avatar: userData?.avatar,
          created_at: new Date().toISOString()
        }]);
        setNewMessage('');
        setAttachments([]);
        setReplyingTo(null);

        lastSeenMsgIdRef.current = data.data.message_id;
        fetch(`/api/conversations/${activeChat.conversation_id}/seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: data.data.message_id })
        }).catch(() => { });

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
        setNewMessage(msg);
        setAttachments(currentAttachments);
        showError(data.message || 'Failed to send message');
      }
    } catch (e: any) {
      console.error('Error sending message:', e);
      showError(e.message || 'Network error');
    } finally {
      setSendingMessage(false);
    }
  };

  const parseMessageData = (jsonStr: string) => {
    if (!jsonStr) return { text: 'No messages yet', media: [], status: null, reactions: {}, reply_to: null };

    if (jsonStr.startsWith('B64:')) {
      try {
        return { text: decodeURIComponent(escape(atob(jsonStr.substring(4)))), media: [], status: null, reactions: {}, reply_to: null };
      } catch (e) {
        return { text: jsonStr, media: [], status: null, reactions: {}, reply_to: null };
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);
      let text = parsed.text || '';
      if (text.startsWith('B64:')) {
        try {
          text = decodeURIComponent(escape(atob(text.substring(4))));
        } catch (e) { }
      }
      return {
        text,
        media: parsed.media || [],
        status: parsed.status,
        reactions: parsed.reactions || {},
        reply_to: parsed.reply_to || null
      };
    } catch {
      return { text: jsonStr, media: [], status: null, reactions: {}, reply_to: null };
    }
  };

  const toggleReaction = async (messageId: number, reaction: string) => {
    if (!activeChat) return;
    try {
      const res = await fetch(`/api/conversations/${activeChat.conversation_id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => prev.map(m => {
          if (m.message_id === messageId) {
            const parsed = parseMessageData(m.content);
            parsed.reactions = data.reactions;
            return { ...m, content: JSON.stringify(parsed) };
          }
          return m;
        }));
      } else {
        showError(data.message || 'Failed to toggle reaction');
      }
    } catch (e) {
      showError('Network error');
    } finally {
      setSelectedMessageId(null);
    }
  };

  const getPlainPreviewText = (parsedMsg: any) => {
    if (parsedMsg.status === 'deleted') return 'Deleted message';
    if (parsedMsg.text) return parsedMsg.text.length > 50 ? parsedMsg.text.substring(0, 50) + '...' : parsedMsg.text;
    if (parsedMsg.media && parsedMsg.media.length > 0) return 'Attachment';
    return '';
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
    let Icon = null;
    let fallbackText = '';

    if (data.media && data.media.length > 0) {
      const firstMedia = data.media[0];
      if (firstMedia.type === 'image') {
        Icon = ImageIcon;
        fallbackText = 'Photo';
      } else if (firstMedia.type === 'attachment') {
        if (firstMedia.mime_type?.startsWith('image/')) {
          Icon = ImageIcon;
          fallbackText = 'Photo';
        } else if (firstMedia.mime_type?.startsWith('video/')) {
          Icon = Video;
          fallbackText = 'Video';
        } else if (firstMedia.mime_type?.startsWith('audio/')) {
          Icon = Music;
          fallbackText = 'Audio';
        } else {
          Icon = FileText;
          fallbackText = 'Document';
        }
      }
    }

    if (data.text) {
      return (
        <span className="inline-flex items-center gap-1 w-full truncate">
          {Icon && <Icon size={14} className="shrink-0" />}
          <span className="truncate">{data.text}</span>
        </span>
      );
    }

    if (Icon) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500 w-full truncate">
          <Icon size={14} className="shrink-0" /> <span className="truncate">{fallbackText}</span>
        </span>
      );
    }

    return '';
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
        showError(data.message || 'Failed to delete message');
      }
    } catch (e) {
      showError('Network error while deleting');
    }
  };

  const handleRequestAction = async (id: number, action: 'accept' | 'ignore') => {
    try {
      const res = await fetch(`/api/chat_requests/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData();
      } else {
        showError(data.message || `Failed to ${action} request`);
      }
    } catch (e) {
      showError('Network error');
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
          showError(data.message || 'Failed to send request');
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
    <>
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 md:p-4 border-4 border-black z-[100] flex gap-3 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 font-bold text-sm md:text-base">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="hover:scale-110 transition-transform"><X size={20} /></button>
        </div>
      )}
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

        <div
          className={`bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-col min-h-[400px] ${activeChat ? 'fixed top-0 left-0 w-full h-[100dvh] md:inset-0 md:h-full z-[60] md:static md:flex-1 flex border-0 md:border-4 shadow-none md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'hidden md:flex flex-1'}`}
          onClick={closeAllMenus}
        >
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
                          <div className="relative group">
                            {/* TOUCH TARGET FOR MESSAGE */}
                            <div
                              className={`border-2 border-black p-2 md:p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isMine ? 'bg-[#3B82F6] text-white' : 'bg-gray-200 text-black'} cursor-pointer md:cursor-default transition-transform select-none touch-pan-y`}
                              onTouchStart={(e) => {
                                if (parsedMsg.status === 'deleted') return;
                                isLongPressTriggered.current = false;
                                touchStartX.current = e.touches[0].clientX;

                                // Start long press timer
                                longPressTimer.current = setTimeout(() => {
                                  isLongPressTriggered.current = true;
                                  if (window.innerWidth < 768) {
                                    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
                                    setSelectedMessageId(msg.message_id);
                                  }
                                }, 400); // 400ms hold
                              }}
                              onTouchEnd={(e) => {
                                if (longPressTimer.current) clearTimeout(longPressTimer.current);

                                if (touchStartX.current && !isLongPressTriggered.current) {
                                  const currentX = touchCurrentX.current ?? touchStartX.current;
                                  const diff = currentX - touchStartX.current;

                                  if (Math.abs(diff) > 50) {
                                    // Swipe
                                    if ((!isMine && diff > 50) || (isMine && diff < -50)) {
                                      setReplyingTo({ message_id: msg.message_id, text: getPlainPreviewText(parsedMsg) });
                                    }
                                  }
                                }
                                e.currentTarget.style.transform = 'translateX(0)';
                                touchStartX.current = null;
                                touchCurrentX.current = null;
                              }}
                              onTouchMove={(e) => {
                                if (touchStartX.current) {
                                  const currentX = e.touches[0].clientX;
                                  const diff = currentX - touchStartX.current;

                                  // Cancel long press if they move their finger more than 10px
                                  if (Math.abs(diff) > 10 && longPressTimer.current) {
                                    clearTimeout(longPressTimer.current);
                                  }

                                  if ((!isMine && diff > 0 && diff < 80) || (isMine && diff < 0 && diff > -80)) {
                                    e.currentTarget.style.transform = `translateX(${diff}px)`;
                                    touchCurrentX.current = currentX;
                                  }
                                }
                              }}
                            >
                              {parsedMsg.reply_to && (
                                <div className={`mb-2 p-2 border-l-4 border-black text-xs font-bold truncate opacity-80 ${isMine ? 'bg-black/20 text-white' : 'bg-black/10 text-black'}`}>
                                  {parsedMsg.reply_to.text || 'Message'}
                                </div>
                              )}
                              <div className="font-bold text-sm break-words whitespace-pre-wrap">
                                {parsedMsg.status === 'deleted' ? getPreviewText(msg.content) : parsedMsg.text}
                              </div>
                              {parsedMsg.media && parsedMsg.media.length > 0 && parsedMsg.status !== 'deleted' && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {parsedMsg.media.map((m: any, i: number) => {
                                    if (m.type === 'image') {
                                      return <img key={i} src={m.data} alt="attachment" onClick={() => setLightboxMedia({ url: m.data, type: 'image' })} className="max-w-[200px] max-h-[200px] border-2 border-black object-contain bg-black cursor-pointer hover:opacity-80 transition-opacity" />;
                                    } else if (m.type === 'attachment') {
                                      const url = `/api/attachments/${m.uuid}`;
                                      if (m.mime_type?.startsWith('image/')) {
                                        return <img key={i} src={url} alt="attachment" onClick={() => setLightboxMedia({ url, type: 'image', name: m.original_name })} className="max-w-[200px] max-h-[200px] border-2 border-black object-contain bg-black cursor-pointer hover:opacity-80 transition-opacity" />;
                                      } else if (m.mime_type?.startsWith('video/')) {
                                        return (
                                          <div key={i} onClick={() => setLightboxMedia({ url, type: 'video', name: m.original_name })} className="relative cursor-pointer w-fit h-fit border-2 border-black bg-black group">
                                            <video src={url} className="max-w-[200px] max-h-[200px] object-contain pointer-events-none block" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors pointer-events-none">
                                              <Play size={24} className="text-white drop-shadow-md" fill="white" />
                                            </div>
                                          </div>
                                        );
                                      } else if (m.mime_type?.startsWith('audio/')) {
                                        return <div key={i} onClick={() => setLightboxMedia({ url, type: 'audio', name: m.original_name })} className="text-xs bg-gray-200 text-black p-2 font-bold border-2 border-black flex items-center gap-1 hover:bg-black hover:text-white transition-colors truncate max-w-[200px] cursor-pointer"><Music size={16} /> {m.original_name}</div>;
                                      } else {
                                        return <div key={i} onClick={() => setLightboxMedia({ url, type: 'document', name: m.original_name })} className="text-xs bg-gray-200 text-black p-2 font-bold border-2 border-black flex items-center gap-1 hover:bg-black hover:text-white transition-colors truncate max-w-[200px] cursor-pointer"><FileText size={16} /> {m.original_name}</div>;
                                      }
                                    }
                                    return null;
                                  })}
                                </div>
                              )}
                              <div className={`text-[10px] font-bold mt-1 ${isMine ? 'text-white/60 text-right' : 'text-black/40'}`}>
                                {formatTime(msg.created_at)}
                              </div>
                              {parsedMsg.reactions && Object.keys(parsedMsg.reactions).length > 0 && (
                                <div className={`flex flex-wrap gap-1 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {Object.entries(parsedMsg.reactions).map(([emoji, users]: [string, any]) => (
                                    <button
                                      key={emoji}
                                      onClick={(e) => { e.stopPropagation(); toggleReaction(msg.message_id, emoji); }}
                                      className={`text-[10px] px-1.5 py-0.5 border border-black font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform ${users.includes(currentUserId) ? 'bg-yellow-300 text-black' : 'bg-white text-black'}`}
                                    >
                                      {emoji} {users.length > 1 ? users.length : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* ACTION MENU (Separated from touch target) */}
                            <div className={`absolute top-[calc(100%-10px)] ${isMine ? 'right-4' : 'left-4'} flex flex-wrap items-center gap-2 bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all z-20 ${selectedMessageId === msg.message_id ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:scale-100'}`}>
                              {!msg.content?.includes('"status":"deleted"') && (
                                <>
                                  <div className="flex gap-1 px-1">
                                    {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                                      <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.message_id, emoji); setSelectedMessageId(null); }} className="hover:scale-125 transition-transform text-lg select-none" type="button">{emoji}</button>
                                    ))}
                                  </div>
                                  <div className="w-[2px] h-4 bg-black/20"></div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyingTo({ message_id: msg.message_id, text: getPlainPreviewText(parsedMsg) });
                                      setSelectedMessageId(null);
                                    }}
                                    className="bg-blue-300 text-black p-1.5 border-2 border-black hover:scale-110 transition-transform select-none"
                                    title="Reply"
                                  >
                                    <Reply size={14} />
                                  </button>
                                </>
                              )}
                              {isMine && !msg.content?.includes('"status":"deleted"') && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); deleteMessage(msg.message_id); }}
                                  className="bg-red-500 text-white p-1.5 border-2 border-black hover:scale-110 transition-transform select-none"
                                  title="Delete Message"
                                >
                                  <Trash size={14} />
                                </button>
                              )}
                            </div>
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
                    <div key={i} className="relative shrink-0 w-16 h-16 border-2 border-black bg-white flex flex-col justify-center items-center group overflow-hidden">
                      {att.file.type.startsWith('image/') && att.previewUrl ? (
                        <img src={att.previewUrl} className="w-full h-full object-cover" alt="preview" />
                      ) : att.file.type.startsWith('video/') && att.previewUrl ? (
                        <>
                          <video src={att.previewUrl} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Play size={20} className="text-white drop-shadow-md" fill="white" />
                          </div>
                        </>
                      ) : (
                        <div className="font-bold text-[8px] p-1 truncate w-full text-center flex flex-col items-center">
                          {att.file.type.startsWith('audio/') ? <Music size={16} className="mb-1" /> : <FileText size={16} className="mb-1" />}
                          <span className="truncate w-full">{att.file.name}</span>
                        </div>
                      )}
                      {att.progress > 0 && att.progress < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{att.progress}%</span>
                        </div>
                      )}
                      <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity">
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input - sticky bottom on mobile */}
              <div className="p-2 md:p-3 border-t-4 border-black bg-white shrink-0 flex flex-col">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-gray-100 border-2 border-black p-2 mb-2 w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Replying to</span>
                      <span className="text-xs font-bold text-gray-700 truncate">{replyingTo.text}</span>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:scale-110 transition-transform text-black shrink-0">
                      <XIcon size={16} />
                    </button>
                  </div>
                )}
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2 items-end w-full"
                >
                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <div className="relative group/attach shrink-0">
                    <button type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.innerWidth < 768) setShowAttachMenu(!showAttachMenu);
                      }}
                      className="bg-gray-200 h-[44px] md:h-[52px] border-4 border-black px-3 md:px-4 text-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center peer"
                    >
                      <Paperclip size={20} />
                    </button>
                    <div className={`absolute bottom-full left-0 mb-2 w-40 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 transition-all ${showAttachMenu ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover/attach:opacity-100 md:group-hover/attach:visible'}`}>
                      <button type="button" onClick={() => triggerFileSelect('image/*')} className="flex items-center gap-2 p-3 font-bold hover:bg-gray-200 hover:text-black transition-colors border-b-2 border-black text-left"><ImageIcon size={16} /> Images</button>
                      <button type="button" onClick={() => triggerFileSelect('video/*')} className="flex items-center gap-2 p-3 font-bold hover:bg-gray-200 hover:text-black transition-colors border-b-2 border-black text-left"><Video size={16} /> Video</button>
                      <button type="button" onClick={() => triggerFileSelect('audio/*')} className="flex items-center gap-2 p-3 font-bold hover:bg-gray-200 hover:text-black transition-colors border-b-2 border-black text-left"><Music size={16} /> Audio</button>
                      <button type="button" onClick={() => triggerFileSelect('application/pdf,text/plain')} className="flex items-center gap-2 p-3 font-bold hover:bg-gray-200 hover:text-black transition-colors border-b-2 border-black text-left"><FileText size={16} /> Document</button>
                      <button type="button" onClick={() => triggerFileSelect('*/*')} className="flex items-center gap-2 p-3 font-bold hover:bg-gray-200 hover:text-black transition-colors text-left"><Archive size={16} /> Other Files</button>
                    </div>
                  </div>
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
                    disabled={sendingMessage || (!newMessage.trim() && attachments.length === 0)}
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

        {/* Lightbox Modal */}
        <AnimatePresence>
          {lightboxMedia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
              onClick={() => setLightboxMedia(null)}
            >
              <button className="absolute top-4 right-4 bg-white text-black border-2 border-black p-2 hover:bg-black hover:text-white transition-colors cursor-pointer z-10" title="Close">
                <XIcon size={24} />
              </button>

              <div className="relative max-w-full max-h-[80vh] flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
                {lightboxMedia.type === 'image' && (
                  <img src={lightboxMedia.url} className="max-w-full max-h-[60vh] border-4 border-black object-contain bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]" alt="preview" />
                )}
                {lightboxMedia.type === 'video' && (
                  <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[60vh] border-4 border-black bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]" />
                )}
                {lightboxMedia.type === 'audio' && (
                  <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col items-center gap-6 min-w-[300px]">
                    <Music size={64} className="text-[#3B82F6]" />
                    <div className="font-black text-center truncate w-full px-4 text-black">{lightboxMedia.name || 'Audio File'}</div>
                    <audio src={lightboxMedia.url} controls autoPlay className="w-full" />
                  </div>
                )}
                {lightboxMedia.type === 'document' && (
                  <div className="bg-white p-10 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col items-center gap-4 min-w-[300px]">
                    <FileText size={80} className="text-gray-400" />
                    <div className="font-black text-xl text-center truncate w-full max-w-[400px] text-black">{lightboxMedia.name || 'Document'}</div>
                  </div>
                )}

                {/* Save / Open Buttons */}
                <div className="flex gap-4">
                  {lightboxMedia.type === 'document' && (lightboxMedia.name?.toLowerCase().endsWith('.pdf') || lightboxMedia.name?.toLowerCase().endsWith('.txt')) && (
                    <button
                      onClick={handleOpenDocument}
                      className="bg-yellow-300 text-black font-black uppercase tracking-widest py-3 px-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={20} /> Open File
                    </button>
                  )}
                  <a
                    href={lightboxMedia.url}
                    download={lightboxMedia.name || 'download'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#3B82F6] text-white font-black uppercase tracking-widest py-3 px-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all flex items-center gap-2"
                  >
                    <Download size={20} /> Save File
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incoming Requests Modal Popup */}
        <AnimatePresence>
          {showDrawer && (
            <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
            <div className="fixed top-0 left-0 w-full h-[calc(100dvh-4rem)] md:inset-0 md:h-full z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
    </>
  );
}
