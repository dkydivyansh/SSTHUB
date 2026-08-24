import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Pencil, Trash2, Pin, PinOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LinkPreview from './LinkPreview';

interface PostCardProps {
  item: {
    id?: number;
    groupid?: string | number;
    group_name?: string;
    group_logo?: string;
    post_type: 'announcement' | 'event';
    context: any;
    extras: any;
    created_at?: string;
    pinned?: boolean;
  };
  isAdmin?: boolean;
  isDashboard?: boolean;
  onDelete?: (id: number, type: string) => void;
  onPin?: (id: number, type: string, currentStatus: boolean) => void;
}

const escapeHTML = (str: string) => {
  return str.replace(/[&<>'"]/g, (tag) => {
    const charsToReplace: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
};

const formatText = (text: string) => {
  if (!text) return { __html: '' };
  
  let formatted = escapeHTML(text);
  
  // WhatsApp style formatting
  formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  formatted = formatted.replace(/~(.*?)~/g, '<del>$1</del>');
  formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-200 text-red-600 px-1 border border-gray-300">$1</code>');
  
  // Links
  formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
  
  // Newlines to breaks
  formatted = formatted.replace(/\n/g, '<br />');

  return { __html: formatted };
};

function timeAgo(dateString: string) {
  const date = new Date(dateString.replace(/-/g, '/'));
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'Just now';
}

export default function PostCard({ item, isAdmin, isDashboard, onDelete, onPin }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isPinning, setIsPinning] = useState(false);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  if (!item) return null;
  const ctx = typeof item.context === 'string' ? JSON.parse(item.context || '{}') : (item.context || {});
  const extras = typeof item.extras === 'string' ? JSON.parse(item.extras || '{}') : (item.extras || {});

  let content = ctx.content || '';
  if (content) {
    try {
      const decoded = decodeURIComponent(escape(atob(content)));
      if (/^[A-Za-z0-9+/\n]+=*$/.test(content.trim())) {
        content = decoded;
      }
    } catch(e) {}
  }

  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      setIsClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [content, isExpanded]);

  const handleEdit = () => {
    navigate(`/dash/community/${item.groupid}/create?edit=${item.id}&type=${item.post_type}`, { state: { editPost: item } });
  };

  const extractFirstUrl = (text: string) => {
    if (!text) return null;
    const match = text.match(/(https?:\/\/[^\s<]+)/);
    // Remove trailing punctuation that might have been caught
    let url = match ? match[1] : null;
    if (url && (url.endsWith('.') || url.endsWith(',') || url.endsWith(')'))) {
      url = url.slice(0, -1);
    }
    return url;
  };

  const previewUrl = extractFirstUrl(content);

  const handleConfirmDelete = async () => {
    if (!item.id || !onDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDelete(item.id, item.post_type);
      setShowConfirm(false);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!item.id || !onPin) return;
    setIsPinning(true);
    try {
      await onPin(item.id, item.post_type, !!item.pinned);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className={`relative bg-white border-4 border-black mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${item.pinned ? 'ring-4 ring-yellow-400 ring-offset-4' : ''}`}>
      
      {isDashboard && item.group_name && (
        <div className="flex items-center gap-2 bg-[#f4f4f5] border-b-4 border-black p-2 px-4 cursor-pointer" onClick={() => navigate(`/dash/community/${item.groupid}`)}>
          {item.group_logo ? (
            <img src={item.group_logo} alt={item.group_name} className="w-6 h-6 border-2 border-black rounded-full" />
          ) : (
            <div className="w-6 h-6 bg-black border-2 border-black rounded-full" />
          )}
          <span className="font-black text-sm uppercase tracking-widest">{item.group_name}</span>
          <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-white bg-black px-2 py-1">
            {item.post_type}
          </span>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-white/90 backdrop-blur-sm border-b-4 border-black">
          <p className="font-black uppercase tracking-widest text-center mb-4 text-sm">
            Delete this {item.post_type}?
          </p>
          {deleteError && (
             <div className="bg-red-500 text-white p-2 font-bold border-2 border-black text-xs mb-4 text-center">
               {deleteError}
             </div>
          )}
          <div className="flex gap-4">
            <button 
              onClick={() => { setShowConfirm(false); setDeleteError(''); }}
              disabled={isDeleting}
              className="bg-white border-2 border-black px-4 py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-black text-white px-4 py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {(ctx.title || item.created_at) && (
        <div className={`p-3 px-4 flex flex-row items-center justify-between gap-2 md:gap-4 relative ${
          item.pinned ? 'bg-yellow-400 text-black' : 
          (isDashboard && item.post_type === 'event' ? 'bg-emerald-500 text-white' : 
           isDashboard ? 'bg-[#3B82F6] text-white' : 'bg-black text-white')
        }`}>
          <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-hidden w-full">
            {item.pinned ? (
              <Pin size={16} className="shrink-0 fill-current" />
            ) : null}
            <h3 className="font-black text-xl uppercase tracking-tighter break-words whitespace-normal leading-none md:leading-normal shrink w-full">
              {ctx.title || 'Untitled'}
            </h3>
            {item.created_at && (
              <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 whitespace-nowrap hidden md:inline ${
                item.pinned ? 'text-black/60' : (isDashboard ? 'text-white/80' : 'text-gray-400')
              }`}>
                {timeAgo(item.created_at)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {item.created_at && (
              <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 whitespace-nowrap md:hidden ${
                item.pinned ? 'text-black/60' : (isDashboard ? 'text-white/80' : 'text-gray-400')
              }`}>
                {timeAgo(item.created_at)}
              </span>
            )}
            {isAdmin && (
              <div className="flex items-center gap-3 bg-white text-black px-2 py-1 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                <button 
                  onClick={handleTogglePin} 
                  disabled={isPinning}
                  className={`hover:text-yellow-500 transition-colors ${isPinning ? 'opacity-50' : ''}`} 
                  title={item.pinned ? 'Unpin' : 'Pin'}
                >
                  {item.pinned ? <PinOff size={16} strokeWidth={3} /> : <Pin size={16} strokeWidth={3} />}
                </button>
                <button onClick={handleEdit} className="hover:text-blue-600 transition-colors" title="Edit">
                  <Pencil size={16} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="hover:text-red-600 transition-colors" 
                  title="Delete"
                >
                  <Trash2 size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">
        {item.post_type === 'event' && (
          <div className="flex flex-col gap-2 self-start">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest border-2 border-black p-2 bg-white">
              {ctx.type === 'offline' ? (
                <span className="flex items-center gap-1 text-orange-500"><MapPin size={14} /> Offline</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-500"><MapPin size={14} /> Virtual</span>
              )}
              {ctx.time && <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(ctx.time).toLocaleString()}</span>}
            </div>
            {ctx.type === 'offline' && extras?.address && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-widest border-2 border-black p-2 bg-yellow-300">
                <MapPin size={14} /> <span>{extras.address}</span>
              </div>
            )}
          </div>
        )}

        {content && (
          <div className="flex flex-col gap-1">
            <div 
              ref={contentRef}
              className={`text-base font-bold text-gray-800 break-words transition-all ${isExpanded ? '' : 'line-clamp-5'}`}
              dangerouslySetInnerHTML={formatText(content)} 
            />
            {isClamped && !isExpanded && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                className="text-[#3B82F6] font-black uppercase tracking-widest text-xs self-start hover:underline mt-1 cursor-pointer"
              >
                ... Read More
              </button>
            )}
            {isExpanded && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="text-[#3B82F6] font-black uppercase tracking-widest text-xs self-start hover:underline mt-1 cursor-pointer"
              >
                Show Less
              </button>
            )}
          </div>
        )}

        {previewUrl && (
          <LinkPreview url={previewUrl} />
        )}

        {ctx.tags && Array.isArray(ctx.tags) && ctx.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {ctx.tags.map((tag: string, i: number) => (
              <span key={i} className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-1">#{tag}</span>
            ))}
          </div>
        )}

        {extras && Object.keys(extras).filter(k => k !== 'address').length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t-2 border-black border-dashed">
            {Object.entries(extras).filter(([k]) => k !== 'address').map(([label, link], i) => (
              <a 
                key={i} 
                href={link as string} 
                target="_blank" 
                rel="noreferrer" 
                className={`${label === 'RSVP' ? 'bg-emerald-500' : 'bg-[#3B82F6]'} text-white px-4 py-2 font-black text-xs uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black`}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
