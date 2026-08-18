import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

export default function CreateGroupPost() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'announcement'; // announcement or event
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder for actual API submission
    console.log("Submitting", { title, content, type });
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/dash/community/${groupId}/${type}s`);
    }, 1000);
  };

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
        <div className="w-16" /> {/* Spacer */}
      </div>

      <div className="p-4 flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-widest text-xs">Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
              placeholder={`Enter ${type} title...`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-widest text-xs">Content (Markdown)</label>
            <textarea 
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-4 border-black p-3 font-bold min-h-[200px] resize-y focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
              placeholder="Write your post in Markdown..."
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-[#3B82F6] text-white p-4 font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-4 border-black mt-4"
          >
            <Send size={20} /> {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
