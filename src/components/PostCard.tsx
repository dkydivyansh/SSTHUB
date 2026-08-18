import { Calendar as CalendarIcon, MapPin } from 'lucide-react';

interface PostCardProps {
  item: {
    id?: number;
    post_type: 'announcement' | 'event';
    context: any;
    extras: any;
    created_at?: string;
    pinned?: boolean;
  };
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

export default function PostCard({ item }: PostCardProps) {
  let ctx: any = {};
  let extras: any = {};
  try {
    ctx = typeof item.context === 'string' ? JSON.parse(item.context) : (item.context || {});
    extras = typeof item.extras === 'string' ? JSON.parse(item.extras) : (item.extras || {});
  } catch(e) {}

  let content = ctx.content || '';
  if (content) {
    try {
      content = decodeURIComponent(escape(atob(content)));
    } catch(e) {
      // If not base64 encoded, just use as is
    }
  }

  return (
    <div className="border-4 border-black bg-[#f4f4f5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col w-full">
      {(ctx.title || item.created_at) && (
        <div className="bg-black text-white p-3 px-4 flex items-center justify-between gap-4">
          <h3 className="font-black text-xl uppercase tracking-tighter truncate">{ctx.title || 'Untitled'}</h3>
          {item.created_at && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
              {timeAgo(item.created_at)}
            </span>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">
        {item.post_type === 'event' && (
          <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest border-2 border-black p-2 bg-white self-start">
            {ctx.type === 'offline' ? (
              <span className="flex items-center gap-1 text-orange-500"><MapPin size={14} /> Offline</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500"><MapPin size={14} /> Virtual</span>
            )}
            {ctx.time && <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(ctx.time).toLocaleString()}</span>}
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

        {extras && Object.keys(extras).length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t-2 border-black border-dashed">
            {Object.entries(extras).map(([label, link], i) => (
              <a key={i} href={link as string} target="_blank" rel="noreferrer" className="bg-[#3B82F6] text-white px-4 py-2 font-black text-xs uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
