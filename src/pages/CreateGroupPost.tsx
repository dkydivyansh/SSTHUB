import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Trash2, Eye, Pencil } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function CreateGroupPost() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const rawType = searchParams.get('type') || 'announcement';
  const type = rawType.endsWith('s') ? rawType.slice(0, -1) : rawType;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [eventType, setEventType] = useState<'virtual' | 'offline'>('virtual');
  const [eventTime, setEventTime] = useState('');
  const [buttons, setButtons] = useState<{ label: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const addButton = () => setButtons([...buttons, { label: '', url: '' }]);
  const removeButton = (idx: number) => setButtons(buttons.filter((_, i) => i !== idx));
  const updateButton = (idx: number, field: 'label' | 'url', value: string) => {
    const updated = [...buttons];
    updated[idx][field] = value;
    setButtons(updated);
  };

  const buildPreviewItem = () => {
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const buttonsObj: Record<string, string> = {};
    buttons.forEach(b => { if (b.label && b.url) buttonsObj[b.label] = b.url; });

    const ctx: any = {
      title: title || 'Untitled',
      content: content ? btoa(unescape(encodeURIComponent(content))) : '',
      tags: tagsArray
    };
    if (type === 'event') {
      ctx.type = eventType;
      ctx.time = eventTime || null;
    }

    return {
      id: 0,
      post_type: type as 'announcement' | 'event',
      context: ctx,
      extras: Object.keys(buttonsObj).length > 0 ? buttonsObj : null,
      created_at: new Date().toISOString()
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const tagsStr = tags;
    const encodedContent = content ? btoa(unescape(encodeURIComponent(content))) : '';
    const buttonsObj: Record<string, string> = {};
    buttons.forEach(b => { if (b.label && b.url) buttonsObj[b.label] = b.url; });

    try {
      const res = await fetch('/api/add_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          post_type: type,
          title,
          content: encodedContent,
          tags: tagsStr,
          event_type: type === 'event' ? eventType : undefined,
          event_time: type === 'event' ? eventTime : undefined,
          buttons: Object.keys(buttonsObj).length > 0 ? buttonsObj : null
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        navigate(`/dash/community/${groupId}/${type}s`);
      } else {
        setError(result.message || 'Failed to create post');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass = "border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full";

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#f4f4f5] relative -m-4 w-[calc(100%+2rem)] sm:m-0 sm:w-full">
      <div className="p-4 bg-white border-b-4 border-black flex items-center justify-between">
        <button 
          onClick={() => navigate(`/dash/community/${groupId}`)}
          className="bg-black text-white p-2 md:px-4 md:py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-black uppercase tracking-tighter text-lg">New {type}</h1>
        <div className="w-16" />
      </div>

      <div className="p-4 flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Edit / Preview Toggle */}
        <div className="flex gap-0 mb-4 border-4 border-black self-start">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors ${!previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors border-l-4 border-black ${previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        {previewMode ? (
          <div className="flex flex-col gap-4">
            <p className="font-black uppercase tracking-widest text-xs text-gray-500">Live Preview</p>
            <PostCard item={buildPreviewItem()} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {error && (
              <div className="bg-red-500 text-white p-3 font-bold border-4 border-black text-sm">{error}</div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs">Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder={`Enter ${type} title...`} />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
              <label className="font-black uppercase tracking-widest text-xs">Content *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} required className={`${inputClass} min-h-[160px] resize-y`} placeholder="Write your post here..." />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">*bold*, _italic_, ~strike~, `code`</span>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs">Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} className={inputClass} placeholder="e.g. important, deadline, exam" />
            </div>

            {/* Event-specific fields */}
            {type === 'event' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">Event Type *</label>
                  <select value={eventType} onChange={e => setEventType(e.target.value as any)} className={`${inputClass} cursor-pointer appearance-none`}>
                    <option value="virtual">Virtual</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">Event Date & Time *</label>
                  <input required type="datetime-local" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputClass} />
                </div>
              </>
            )}

            {/* Button Links */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="font-black uppercase tracking-widest text-xs">Button Links (Optional)</label>
                <button type="button" onClick={addButton} className="bg-black text-white p-1.5 hover:-translate-y-0.5 transition-transform">
                  <Plus size={14} />
                </button>
              </div>
              {buttons.map((btn, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} className="border-4 border-black p-2 font-bold text-sm flex-1 focus:outline-none" placeholder="Label" />
                  <input value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)} className="border-4 border-black p-2 font-bold text-sm flex-[2] focus:outline-none" placeholder="https://..." />
                  <button type="button" onClick={() => removeButton(i)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3B82F6] text-white p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-4 border-black mt-2"
            >
              <Send size={20} /> {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
