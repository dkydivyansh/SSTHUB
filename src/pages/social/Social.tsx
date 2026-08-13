import { Search, MessageSquare, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Social() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left Column - People List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-4 border-b-4 border-black bg-[#FFF5E1]">
          <h2 className="font-black uppercase tracking-widest text-xl mb-4">People</h2>
          <div 
            onClick={() => navigate('/dash/social/discover')}
            className="flex items-center gap-2 bg-white border-4 border-black p-3 cursor-text group hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all"
          >
            <Search size={20} className="text-black/50 group-hover:text-[#3B82F6] transition-colors" />
            <span className="font-bold text-black/50 uppercase tracking-widest text-sm">Search users...</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center opacity-50">
          <Users size={48} className="mb-4" />
          <p className="font-black uppercase tracking-widest">No recent chats</p>
          <p className="font-bold text-sm mt-2">Find someone to connect with!</p>
        </div>
      </div>

      {/* Right Column - Chat Area */}
      <div className="hidden md:flex flex-1 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <MessageSquare size={64} className="mx-auto mb-6 text-[#3B82F6]" />
          <h2 className="font-black text-4xl uppercase tracking-tighter mb-4">Chats Coming Soon</h2>
          <p className="font-bold text-lg mb-8 text-black/70">
            We're building a seamless messaging experience. For now, use the Discover tab to find other members and their public profiles.
          </p>
          <Link 
            to="/dash/social/discover"
            className="inline-block bg-black text-white font-black uppercase tracking-widest px-8 py-4 border-4 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all"
          >
            Discover People
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
