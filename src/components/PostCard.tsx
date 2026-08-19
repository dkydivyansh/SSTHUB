import { Calendar as CalendarIcon, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  item: {
    id?: number;
    groupid?: string | number;
    post_type: 'announcement' | 'event';
    context: any;
    extras: any;
    created_at?: string;
    pinned?: boolean;
  };
  isAdmin?: boolean;
  onDelete?: (id: number, type: string) => void;
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

export default function PostCard({ item, isAdmin, onDelete }: PostCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  let ctx: any = {};
  let extras: any = {};
  try {
    ctx = typeof item.context === 'string' ? JSON.parse(item.context) : (item.context || {});
    extras = typeof item.extras === 'string' ? JSON.parse(item.extras) : (item.extras || {});
  } catch(e) {}

  let content = ctx.content || '';
  if (content) {
    try {
      const decoded = decodeURIComponent(escape(atob(content)));
      if (/^[A-Za-z0-9+/\n]+=*$/.test(content.trim())) {
        content = decoded;
      }
    } catch(e) {}
  }

  const handleEdit = () => {
    // Navigate even if groupid is somehow missing, try extracting from URL if possible?
    // Actually, groupid is now available from backend, but fallback just in case
    const pathGroupId = item.groupid || window.location.pathname.split('/')[3]; 
    if (pathGroupId) {
      navigate(`/dash/community/${pathGroupId}/create?type=${item.post_type}`, {
        state: { editPost: item }
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (onDelete && item.id) {
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
    }
  };

  return (
    <div className="border-4 border-black bg-[#f4f4f5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col w-full relative">
      {/* Custom Confirmation Modal */}
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
        <div className="bg-black text-white p-3 px-4 flex flex-row items-center justify-between gap-2 md:gap-4 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-hidden w-full">
            <h3 className="font-black text-xl uppercase tracking-tighter truncate leading-none md:leading-normal shrink max-w-full">
              {ctx.title || 'Untitled'}
            </h3>
            {item.created_at && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 whitespace-nowrap hidden md:inline">
                {timeAgo(item.created_at)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {item.created_at && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 whitespace-nowrap md:hidden">
                {timeAgo(item.created_at)}
              </span>
            )}
            {isAdmin && (
              <div className="flex items-center gap-3 bg-white text-black px-2 py-1 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
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
          <div 
            className="text-base font-bold text-gray-800 break-words"
            dangerouslySetInnerHTML={formatText(content)} 
          />
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
