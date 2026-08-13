import { useOutletContext } from 'react-router-dom';
import { User, Mail, Hash, Layers, Github, Globe, Instagram, Linkedin, Terminal, Code, Library } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { userData } = useOutletContext<{ userData: any }>();

  let extraData = { description: '', social: { github: '', portfolio: '', instagram: '', linkedin: '', gdev: '', hackerone: '' }, clubs: { nlogn: '' }, research: { orcid: '' } };
  try {
    if (userData.extra) {
      const parsed = typeof userData.extra === 'string' ? JSON.parse(userData.extra) : userData.extra;
      extraData = {
        description: parsed.description || '',
        social: { ...extraData.social, ...parsed.social },
        clubs: { ...extraData.clubs, ...parsed.clubs },
        research: { ...extraData.research, ...parsed.research },
      };
    }
  } catch (e) {
    console.error('Failed to parse extra data', e);
  }

  const { description, social, clubs, research } = extraData;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full"
    >
      {/* Profile Card */}
      <div className="xl:col-span-1 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center h-fit">
        {userData.avatar ? (
          <img src={userData.avatar} alt="Avatar" referrerPolicy="no-referrer" className="w-32 h-32 rounded-full border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-black bg-black text-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <User size={48} />
          </div>
        )}
        
        <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">{userData.name || 'User'}</h2>
        <div className="inline-flex bg-[#3B82F6] text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
          {userData.type}
        </div>

        {description && (
          <div className="w-full border-t-4 border-black pt-6 pb-2">
            <p className="font-bold text-sm text-black/80 italic text-center whitespace-pre-wrap">"{description}"</p>
          </div>
        )}

        <div className="w-full border-t-4 border-black pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 font-bold text-sm">
            <Mail size={18} className="text-[#3B82F6] shrink-0" />
            <span className="truncate">{userData.email}</span>
          </div>
          
          {userData.batch && (
            <div className="flex items-center gap-3 font-bold text-sm">
              <Layers size={18} className="text-[#3B82F6] shrink-0" />
              <span>Batch {userData.batch}</span>
            </div>
          )}
          
          {userData.group && (
            <div className="flex items-center gap-3 font-bold text-sm">
              <Hash size={18} className="text-[#3B82F6] shrink-0" />
              <span>Group {userData.group}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform sm:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-[#3B82F6]">
            <Hash size={24} />
            <h3 className="font-black uppercase tracking-widest text-black">Roll No</h3>
          </div>
          <p className="text-3xl lg:text-4xl font-black tracking-tighter truncate" title={userData.rollno || 'N/A'}>{userData.rollno || 'N/A'}</p>
        </div>

        {(social?.github || social?.portfolio || social?.instagram || social?.linkedin || social?.gdev || social?.hackerone || clubs?.nlogn) && (
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:col-span-2">
            <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl">Social & Clubs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {social?.github && (
                <a href={`https://github.com/${social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Github size={24} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">GitHub</p>
                    <p className="font-black truncate text-sm">{social.github}</p>
                  </div>
                </a>
              )}

              {social?.portfolio && (
                <a href={social.portfolio.startsWith('http') ? social.portfolio : `https://${social.portfolio}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${social.portfolio}&sz=64`} 
                    alt="Favicon" 
                    className="w-6 h-6 object-contain shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  />
                  <Globe size={24} className="text-[#3B82F6] shrink-0 hidden" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">Portfolio</p>
                    <p className="font-black truncate text-sm">{social.portfolio.replace(/^https?:\/\//, '')}</p>
                  </div>
                </a>
              )}

              {social?.linkedin && (
                <a href={`https://linkedin.com/in/${social.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Linkedin size={24} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">LinkedIn</p>
                    <p className="font-black truncate text-sm">{social.linkedin}</p>
                  </div>
                </a>
              )}

              {social?.instagram && (
                <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Instagram size={24} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">Instagram</p>
                    <p className="font-black truncate text-sm">{social.instagram}</p>
                  </div>
                </a>
              )}

              {social?.gdev && (
                <a href={`https://g.dev/${social.gdev}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Code size={24} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">Google Dev</p>
                    <p className="font-black truncate text-sm">{social.gdev}</p>
                  </div>
                </a>
              )}

              {social?.hackerone && (
                <a href={`https://hackerone.com/${social.hackerone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Terminal size={24} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-black/60">HackerOne</p>
                    <p className="font-black truncate text-sm">{social.hackerone}</p>
                  </div>
                </a>
              )}

              {clubs?.nlogn && (
                <div className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white cursor-default">
                  <div className="bg-black p-1 border-2 border-black flex items-center justify-center shrink-0">
                    <img src="/logo-dark.svg" alt="NlogN" className="h-4 w-auto object-contain" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs uppercase tracking-widest text-[#3B82F6]">NlogN</p>
                    <p className="font-black truncate text-sm">{clubs.nlogn}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {research?.orcid && (
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:col-span-2">
            <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl">Research</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <a href={`https://orcid.org/${research.orcid}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                <Library size={24} className="text-[#3B82F6] shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-bold text-xs uppercase tracking-widest text-black/60">ORCID</p>
                  <p className="font-black truncate text-sm">{research.orcid}</p>
                </div>
              </a>

            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
