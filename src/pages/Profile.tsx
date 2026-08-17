import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { User, Mail, Hash, Layers, Github, Globe, Instagram, Linkedin, Terminal, Code, Library, Edit2, LogOut, Share2, ExternalLink, Check, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${userData.rollno}`;
    
    // First try the native share menu (requires HTTPS)
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `${userData.name}'s Profile on SSTHUB`,
          url: url
        });
        return;
      } catch (err) {
        console.error('Share cancelled or failed', err);
      }
    } 

    // Fallback 1: modern clipboard API (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }

    // Fallback 2: Old school execCommand (works on HTTP local LAN)
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback clipboard failed', err);
    }
    textArea.remove();
  };

  let extraData = { description: '', social: { github: '', portfolio: '', instagram: '', linkedin: '', hackerone: '' }, clubs: { nlogn: '' }, research: { orcid: '' }, disable_public_profile: false, interests: [] as string[] };
  try {
    if (userData.extra) {
      const parsed = typeof userData.extra === 'string' ? JSON.parse(userData.extra) : userData.extra;
      extraData = {
        description: parsed.description || '',
        social: { ...extraData.social, ...parsed.social },
        clubs: { ...extraData.clubs, ...parsed.clubs },
        research: { ...extraData.research, ...parsed.research },
        disable_public_profile: parsed.disable_public_profile || false,
        interests: parsed.interests || []
      };
    }
  } catch (e) {
    console.error('Failed to parse extra data', e);
  }

  const { description, social, clubs, research, disable_public_profile, interests } = extraData;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full relative"
    >
      {/* Left Column Container */}
      <div className="xl:col-span-1 flex flex-col gap-6 xl:sticky xl:top-8 z-10 self-start">
        
        {userData.type === 'admin' && (
          <Link to="/admindash" className="bg-black text-white font-black uppercase tracking-widest p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(239,68,68,1)] transition-all flex items-center justify-center gap-3 w-full text-center group">
            <ShieldAlert size={20} className="group-hover:text-red-500 transition-colors" />
            Admin Dashboard
          </Link>
        )}

        {/* Profile Card */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center">
        <Link 
          to="/dash/profile/edit"
          className="absolute top-4 right-4 bg-white border-4 border-black p-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] text-black hover:text-[#3B82F6] transition-all"
          title="Edit Profile"
        >
          <Edit2 size={20} />
        </Link>

        {userData.avatar ? (
          <img src={userData.avatar} alt="Avatar" referrerPolicy="no-referrer" className="w-24 h-24 rounded-full border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full border-4 border-black bg-black text-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <User size={36} />
          </div>
        )}
        
        <h2 className="text-2xl font-black text-center uppercase tracking-tighter mb-2">{userData.name || 'User'}</h2>
        <div className="inline-flex bg-[#3B82F6] text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
          {userData.type}
        </div>

        {description && (
          <div className="w-full bg-[#f4f4f5] border-l-8 border-black p-4 mb-6">
            <p className="font-bold text-sm text-black italic whitespace-pre-wrap">"{description}"</p>
          </div>
        )}

        <div className="w-full border-t-4 border-black pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 font-bold text-sm">
            <Mail size={18} className="text-[#3B82F6] shrink-0" />
            <span className="truncate">{userData.email}</span>
          </div>
          
          <div className="flex items-center gap-3 font-bold text-sm">
            <Hash size={18} className="text-[#3B82F6] shrink-0" />
            <span className="truncate">{userData.rollno || 'N/A'}</span>
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

      {/* Action Buttons below Profile Card */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <Link 
          to={`/u/${userData.rollno}`}
          target="_blank"
          className="bg-white text-black font-black uppercase tracking-widest p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all flex flex-col items-center justify-center gap-2 w-full text-center"
        >
          <ExternalLink size={20} className="text-[#3B82F6]" />
          <span className="text-[10px]">View Public</span>
        </Link>
        <button 
          type="button"
          onClick={disable_public_profile ? undefined : handleShare}
          className={`bg-white text-black font-black uppercase tracking-widest p-3 border-4 border-black transition-all flex flex-col items-center justify-center gap-2 w-full text-center relative ${disable_public_profile ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]'}`}
        >
          {disable_public_profile && (
            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] px-2 py-1 border-2 border-black z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              PRIVATE
            </div>
          )}
          {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} className="text-[#3B82F6]" />}
          <span className="text-[10px]">{copied ? 'Copied!' : 'Share Profile'}</span>
        </button>
      </div>

      <Link 
        to="/logout"
        className="bg-black text-white font-black uppercase tracking-widest p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all flex items-center justify-center gap-3 w-full mt-2"
      >
        <LogOut size={20} className="shrink-0" />
        <span className="text-sm">Logout</span>
      </Link>
    </div>

    {/* Details Grid */}
      <div className="xl:col-span-2 flex flex-col justify-start gap-6 min-h-full">
        
        {/* Interests & Hobbies */}
        <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-3 text-lg">Interests & Hobbies</h3>
          
          {interests && interests.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {interests.map((interest, idx) => (
                <div key={idx} className="bg-[#f4f4f5] text-black px-4 py-2 border-4 border-black font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-transform cursor-default">
                  {interest}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-[#FDFDFD] border-4 border-black border-dashed text-center">
              <p className="font-black text-black/50 uppercase tracking-widest text-sm mb-4">No interests added yet</p>
              <Link to="/dash/profile/edit" className="bg-[#3B82F6] text-white px-6 py-2 border-4 border-black font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                Add Interests
              </Link>
            </div>
          )}
        </div>

        {(social?.github || social?.portfolio || social?.instagram || social?.linkedin || social?.hackerone || clubs?.nlogn) && (
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-3 text-lg">Social & Clubs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {social?.github && (
                <a href={`https://github.com/${social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Github size={20} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">GitHub</p>
                    <p className="font-black truncate text-xs">@{social.github}</p>
                  </div>
                </a>
              )}

              {social?.portfolio && (
                <a href={social.portfolio.startsWith('http') ? social.portfolio : `https://${social.portfolio}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${social.portfolio}&sz=64`} 
                    alt="Favicon" 
                    className="w-5 h-5 object-contain shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  />
                  <Globe size={20} className="text-[#3B82F6] shrink-0 hidden" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">Portfolio</p>
                    <p className="font-black truncate text-xs">{social.portfolio.replace(/^https?:\/\//, '')}</p>
                  </div>
                </a>
              )}

              {social?.linkedin && (
                <a href={`https://linkedin.com/in/${social.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Linkedin size={20} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">LinkedIn</p>
                    <p className="font-black truncate text-xs">@{social.linkedin}</p>
                  </div>
                </a>
              )}

              {social?.instagram && (
                <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Instagram size={20} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">Instagram</p>
                    <p className="font-black truncate text-xs">@{social.instagram}</p>
                  </div>
                </a>
              )}

              {social?.hackerone && (
                <a href={`https://hackerone.com/${social.hackerone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <Terminal size={20} className="text-[#3B82F6] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">HackerOne</p>
                    <p className="font-black truncate text-xs">@{social.hackerone}</p>
                  </div>
                </a>
              )}

              {clubs?.nlogn && (
                <div className="flex items-center gap-3 p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white cursor-default">
                  <div className="bg-black p-1 border-2 border-black flex items-center justify-center shrink-0">
                    <img src="/logo-dark.svg" alt="NlogN" className="h-3 w-auto object-contain" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-[#3B82F6]">NlogN</p>
                    <p className="font-black truncate text-xs">@{clubs.nlogn}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {(research?.orcid || (research?.papers && research.papers.length > 0)) && (
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase tracking-widest text-black mb-4 border-b-4 border-black pb-3 text-lg">Research</h3>
            <div className="flex flex-col gap-4">
              
              {research?.orcid && (
                <a href={`https://orcid.org/${research.orcid}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <Library size={24} className="text-[#3B82F6] shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-[10px] uppercase tracking-widest text-black/60">ORCID iD</p>
                      <p className="font-black break-all text-base">{research.orcid}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-black/40 font-bold uppercase tracking-widest text-[10px]">
                    View Profile &rarr;
                  </div>
                </a>
              )}

              {research?.papers && research.papers.length > 0 && (
                <div className="flex flex-col gap-3">
                  {research.papers.map((paper: {title: string, link: string}, idx: number) => (
                    paper.link ? (
                      <a key={idx} href={paper.link.startsWith('http') ? paper.link : `https://${paper.link}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col p-3 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-[#f4f4f5]">
                        <p className="font-bold text-sm uppercase tracking-tight text-black group-hover:text-[#3B82F6] transition-colors">{paper.title}</p>
                        <p className="font-black text-[10px] uppercase tracking-widest text-black/50 mt-1 truncate">{paper.link.replace(/^https?:\/\//, '')}</p>
                      </a>
                    ) : (
                      <div key={idx} className="flex flex-col p-3 border-4 border-black bg-[#f4f4f5]">
                        <p className="font-bold text-sm uppercase tracking-tight text-black">{paper.title}</p>
                      </div>
                    )
                  ))}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
