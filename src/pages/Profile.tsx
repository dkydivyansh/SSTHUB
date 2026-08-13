import { useOutletContext } from 'react-router-dom';
import { User, Mail, Hash, Shield, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { userData } = useOutletContext<{ userData: any }>();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full"
    >
      {/* Profile Card */}
      <div className="xl:col-span-1 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center">
        {userData.avatar ? (
          <img src={userData.avatar} alt="Avatar" referrerPolicy="no-referrer" className="w-32 h-32 rounded-full border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-black bg-black text-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <User size={48} />
          </div>
        )}
        
        <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">{userData.name || 'User'}</h2>
        <div className="inline-flex bg-[#EE5455] text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
          {userData.type}
        </div>

        <div className="w-full border-t-4 border-black pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 font-bold text-sm">
            <Mail size={18} />
            <span className="truncate">{userData.email}</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4 text-[#EE5455]">
            <Layers size={24} />
            <h3 className="font-black uppercase tracking-widest text-black">Batch</h3>
          </div>
          <p className="text-5xl font-black tracking-tighter">{userData.batch || 'N/A'}</p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4 text-[#EE5455]">
            <Hash size={24} />
            <h3 className="font-black uppercase tracking-widest text-black">Roll No</h3>
          </div>
          <p className="text-3xl lg:text-4xl font-black tracking-tighter truncate" title={userData.rollno || 'N/A'}>{userData.rollno || 'N/A'}</p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4 text-[#EE5455]">
            <Hash size={24} />
            <h3 className="font-black uppercase tracking-widest text-black">Group</h3>
          </div>
          <p className="text-5xl font-black tracking-tighter">{userData.group || 'N/A'}</p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4 text-[#EE5455]">
            <Shield size={24} />
            <h3 className="font-black uppercase tracking-widest text-black">Account Status</h3>
          </div>
          <p className="text-2xl font-black uppercase tracking-tighter text-black/80">{userData.status}</p>
        </div>
      </div>
    </motion.div>
  );
}
