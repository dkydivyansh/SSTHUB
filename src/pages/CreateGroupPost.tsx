import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Trash2, Eye, Pencil } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function CreateGroupPost() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editPost = location.state?.editPost;
  const editId = searchParams.get('edit');
  const isEdit = !!editPost || !!editId;

  const rawType = searchParams.get('type') || (editPost ? editPost.post_type : 'announcement');
  const type = rawType.endsWith('s') ? rawType.slice(0, -1) : rawType;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [eventType, setEventType] = useState<'virtual' | 'offline'>('virtual');
  const [eventTime, setEventTime] = useState('');
  const [address, setAddress] = useState('');
  const [rsvpLink, setRsvpLink] = useState('');
  const [buttons, setButtons] = useState<{ label: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  const [featuredMedia, setFeaturedMedia] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
  const [featuredPreviewType, setFeaturedPreviewType] = useState<string | null>(null);
  const [clearFeatured, setClearFeatured] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form if editing
  useEffect(() => {
    const initializeForm = (post: any) => {
      let ctx = post.context || {};
      let extras = post.extras || {};
      if (typeof ctx === 'string') try { ctx = JSON.parse(ctx); } catch(e) {}
      if (typeof extras === 'string') try { extras = JSON.parse(extras); } catch(e) {}

      setTitle(ctx.title || '');
      
      let c = ctx.content || '';
      try {
        const decoded = decodeURIComponent(escape(atob(c)));
        if (/^[A-Za-z0-9+/\n]+=*$/.test(c.trim())) { c = decoded; }
      } catch(e) {}
      setContent(c);
      
      if (Array.isArray(ctx.tags)) {
        setTags(ctx.tags.join(', '));
      }
      
      if (type === 'event') {
        if (ctx.type) setEventType(ctx.type);
        if (ctx.time) setEventTime(ctx.time);
        if (extras.address) {
          setAddress(extras.address);
          delete extras.address;
        }
        if (extras.RSVP) {
          setRsvpLink(extras.RSVP);
          delete extras.RSVP;
        }
      }
      
      if (extras.featured) {
        setFeaturedPreview(`/api/group_attachment_get?id=${extras.featured}`);
        setFeaturedPreviewType(extras.featured_type || 'image/jpeg');
        delete extras.featured;
        delete extras.featured_type;
      }
      
      // Any remaining extras become buttons
      const loadedButtons = Object.entries(extras).map(([label, url]) => ({
        label, url: url as string
      }));
      setButtons(loadedButtons);
    };

    if (editPost) {
      initializeForm(editPost);
    } else if (editId && groupId) {
      // If refreshed without state, try to fetch from group data
      fetch(`/api/group_data?id=${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data.posts) {
            const found = data.data.posts.find((p: any) => String(p.id) === String(editId));
            if (found) initializeForm(found);
          }
        })
        .catch(console.error);
    }
  }, [editPost, editId, groupId, type]);

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
      content: content || '',
      tags: tagsArray
    };
    if (type === 'event') {
      ctx.type = eventType;
      ctx.time = eventTime || null;
      if (eventType === 'offline' && address) {
        buttonsObj['address'] = address;
      }
      if (rsvpLink) {
        buttonsObj['RSVP'] = rsvpLink;
      }
    }

    const extrasObj: any = Object.keys(buttonsObj).length > 0 ? buttonsObj : {};
    
    if (featuredMedia) {
      extrasObj.featured = URL.createObjectURL(featuredMedia);
      extrasObj.featured_type = featuredMedia.type;
    } else if (featuredPreview && !clearFeatured) {
      extrasObj.featured = featuredPreview.replace('/api/group_attachment_get?id=', '');
      extrasObj.featured_type = featuredPreviewType || (extrasObj.featured?.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
    }

    return {
      id: 0,
      post_type: type as 'announcement' | 'event',
      context: ctx,
      extras: Object.keys(extrasObj).length > 0 ? extrasObj : null,
      created_at: new Date().toISOString()
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const tagsStr = tags;
    const buttonsObj: Record<string, string> = {};
    buttons.forEach(b => { if (b.label && b.url) buttonsObj[b.label] = b.url; });

    try {
      let finalFeatured = '';
      let finalFeaturedType = '';
      
      if (featuredMedia) {
        const CHUNK_SIZE = 1024 * 1024;
        const totalChunks = Math.ceil(featuredMedia.size / CHUNK_SIZE);
        const fileUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, featuredMedia.size);
          const chunk = featuredMedia.slice(start, end);
          
          const formData = new FormData();
          formData.append('file_uuid', fileUuid);
          formData.append('chunk_index', i.toString());
          formData.append('total_chunks', totalChunks.toString());
          formData.append('group_id', groupId || '');
          formData.append('original_name', featuredMedia.name);
          formData.append('mime_type', featuredMedia.type || 'application/octet-stream');
          formData.append('chunk', chunk);
          
          const uRes = await fetch('/api/group_attachment_upload', { method: 'POST', body: formData });
          const uData = await uRes.json();
          if (uData.status !== 'success') {
            throw new Error(uData.message || 'Upload failed');
          }
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
        finalFeatured = fileUuid;
        finalFeaturedType = featuredMedia.type;
      }

      const endpoint = isEdit ? '/api/edit_post' : '/api/add_post';
      const body: any = {
        group_id: groupId,
        post_type: type,
        title,
        content,
        tags: tagsStr,
        event_type: type === 'event' ? eventType : undefined,
        event_time: type === 'event' ? eventTime : undefined,
        address: type === 'event' && eventType === 'offline' ? address : undefined,
        rsvp_link: type === 'event' ? rsvpLink : undefined,
        buttons: Object.keys(buttonsObj).length > 0 ? buttonsObj : null,
        featured: finalFeatured || undefined,
        featured_type: finalFeaturedType || undefined,
        clear_featured: clearFeatured
      };

      if (isEdit) {
        body.post_id = editPost ? editPost.id : editId;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.status === 'success') {
        navigate(`/dash/community/${groupId}/${type}s`);
      } else {
        setError(result.message || (isEdit ? 'Failed to edit post' : 'Failed to create post'));
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass = "border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full";

  return (
    <div className="flex flex-col w-full bg-transparent">
      <div className="p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(`/dash/community/${groupId}`)}
          className="bg-black text-white p-2 md:px-4 md:py-2 font-black uppercase text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-black uppercase tracking-tighter text-lg md:text-2xl">{isEdit ? 'Update' : 'New'} {type}</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full gap-4">
        {/* Edit / Preview Toggle */}
        <div className="flex gap-0 border-4 border-black self-start bg-white w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 transition-colors ${!previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 transition-colors border-l-4 border-black ${previewMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6 bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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

            {/* Featured Media */}
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase tracking-widest text-xs">Featured Media (Optional)</label>
              <div className="border-4 border-black p-4 flex flex-col gap-4">
                {(featuredPreview || featuredMedia) ? (
                  <div className="relative group">
                    {((featuredMedia?.type.startsWith('video/') || featuredPreviewType?.startsWith('video/'))) ? (
                      <video src={featuredMedia ? URL.createObjectURL(featuredMedia) : (featuredPreview as string)} controls className="w-full max-h-[300px] object-cover border-2 border-black" />
                    ) : (
                      <img src={featuredMedia ? URL.createObjectURL(featuredMedia) : (featuredPreview as string)} alt="Preview" className="w-full max-h-[300px] object-cover border-2 border-black" />
                    )}
                    <button 
                      type="button"
                      onClick={() => {
                        setFeaturedMedia(null);
                        setFeaturedPreview(null);
                        setFeaturedPreviewType(null);
                        setClearFeatured(true);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 border-2 border-black hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-6 border-4 border-dashed border-gray-400 text-gray-500 font-black uppercase tracking-widest hover:border-black hover:text-black transition-all"
                  >
                    <Plus size={24} /> Add Image or Video
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        setError('File size must be under 50MB');
                        return;
                      }
                      setFeaturedMedia(file);
                      setClearFeatured(false);
                      setError('');
                    }
                  }} 
                />
              </div>
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
                {eventType === 'offline' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-black uppercase tracking-widest text-xs">Address / Location *</label>
                    <input required value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Enter full address..." />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="font-black uppercase tracking-widest text-xs">RSVP Link (Optional)</label>
                  <input value={rsvpLink} onChange={e => setRsvpLink(e.target.value)} className={inputClass} placeholder="https://forms.gle/..." />
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
                <div key={i} className="flex flex-col gap-2 w-full min-w-0 bg-[#f4f4f5] p-3 border-4 border-black">
                  <input value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} className="border-4 border-black p-2 font-bold text-sm w-full focus:outline-none min-w-0 bg-white" placeholder="Label" />
                  <div className="flex gap-2 w-full items-center min-w-0">
                    <input value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)} className="border-4 border-black p-2 font-bold text-sm flex-1 focus:outline-none min-w-0 w-full bg-white" placeholder="https://..." />
                    <button type="button" onClick={() => removeButton(i)} className="text-red-500 hover:text-red-700 p-2 shrink-0 bg-white border-4 border-black hover:-translate-y-1 transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3B82F6] text-white p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-4 border-black mt-2"
            >
              <Send size={20} /> {isSubmitting ? (uploadProgress > 0 && uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Posting...') : 'Post'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
