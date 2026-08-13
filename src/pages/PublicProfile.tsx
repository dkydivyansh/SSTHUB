import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Mail, Hash, Layers, Github, Globe, Instagram, Linkedin, Terminal, Code, Library, MessageSquare, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import PageLoader from '../components/PageLoader';

export default function PublicProfile() {
  const { rollno } = useParams<{ rollno: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [githubData, setGithubData] = useState<any>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public_profile?rollno=${rollno}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUserData(data.data);
        } else {
          setError(data.message || 'Failed to load profile');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, [rollno]);

  useEffect(() => {
    if (!userData || userData.is_private) return;
    
    let githubUsername = '';
    if (userData.extra) {
      try {
        const parsed = typeof userData.extra === 'string' ? JSON.parse(userData.extra) : userData.extra;
        githubUsername = parsed?.social?.github || '';
      } catch (e) {}
    }

    if (!githubUsername) return;

    const cacheKey = `github_stats_${githubUsername}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        const now = new Date().getTime();
        // 1 hour TTL
        if (now - parsedCache.timestamp < 3600000) {
          setGithubData(parsedCache.data);
          return;
        }
      } catch (e) {}
    }

    setGithubLoading(true);
    setGithubError('');
    
    Promise.all([
      fetch(`https://api.github.com/users/${githubUsername}`).then(res => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      }),
      fetch(`https://pinned.berrysauce.dev/get/${githubUsername}`).then(res => {
        if (!res.ok) throw new Error('Repos not found');
        return res.json();
      }).then(repos => repos.slice(0, 4))
    ])
      .then(([user, repos]) => {
        const data = { user, repos };
        setGithubData(data);
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: new Date().getTime(),
          data
        }));
      })
      .catch((err) => {
        setGithubError(err.message || 'Failed to load github profile data');
      })
      .finally(() => {
        setGithubLoading(false);
      });

  }, [userData]);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md w-full">
          <AlertTriangle size={64} className="mx-auto mb-6 text-red-500" />
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Error</h1>
          <p className="font-bold text-black/80">{error || 'User not found'}</p>
          <Link to="/" className="mt-8 inline-block bg-black text-white font-black uppercase tracking-widest px-8 py-4 border-4 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isPrivate = userData.is_private;
  const isLoggedInViewer = userData.is_logged_in_viewer;

  let extraData = { description: '', social: { github: '', portfolio: '', instagram: '', linkedin: '', hackerone: '' }, clubs: { nlogn: '' }, research: { orcid: '' }, interests: [] as string[] };

  if (!isPrivate && userData.extra) {
    try {
      const parsed = typeof userData.extra === 'string' ? JSON.parse(userData.extra) : userData.extra;
      extraData = {
        description: parsed.description || '',
        social: { ...extraData.social, ...parsed.social },
        clubs: { ...extraData.clubs, ...parsed.clubs },
        research: { ...extraData.research, ...parsed.research },
        interests: parsed.interests || []
      };
    } catch (e) {
      console.error('Failed to parse extra data', e);
    }
  }

  const { description, social, clubs, research, interests } = extraData;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-black selection:text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <Link to="/" className="inline-block pt-2 pl-2">
            <div className="font-black text-2xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all">
              SST<span className="text-white px-2 ml-1 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
            </div>
          </Link>

          {isLoggedInViewer ? (
            <Link to="/dash" className="bg-black text-white px-6 py-2 border-4 border-black font-black uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all">
              Bask To Dashboard
            </Link>
          ) : (
            <Link to="/login" className="bg-[#3B82F6] text-white px-6 py-2 border-4 border-black font-black uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              Login
            </Link>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full relative"
        >
          {/* Left Column Container */}
          <div className="xl:col-span-1 flex flex-col gap-6 xl:sticky xl:top-4 z-10 self-start">
            {/* Profile Card */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Avatar" referrerPolicy="no-referrer" className="w-32 h-32 rounded-full border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-black bg-black text-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <User size={48} />
                </div>
              )}

              <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">{userData.name || 'User'}</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {isPrivate && (
                  <div className="inline-flex bg-red-500 text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Private
                  </div>
                )}
                {!isPrivate && userData.type && (
                  <div className="inline-flex bg-[#3B82F6] text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {userData.type}
                  </div>
                )}
                {!isPrivate && clubs && Object.entries(clubs).map(([clubKey, username]) => {
                  if (!username) return null;
                  const clubName = clubKey === 'nlogn' ? 'NlogN' : clubKey.charAt(0).toUpperCase() + clubKey.slice(1);
                  return (
                    <div key={clubKey} className="inline-flex bg-black text-white px-3 py-1 border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] items-center gap-2">
                      {clubKey === 'nlogn' && <img src="/logo-dark.svg" alt="NlogN" className="h-3 w-auto object-contain" />}
                      {clubName}
                    </div>
                  );
                })}
              </div>

              {!isPrivate && description && (
                <div className="w-full bg-[#f4f4f5] border-l-8 border-black p-4 mb-6">
                  <p className="font-bold text-sm text-black italic whitespace-pre-wrap">"{description}"</p>
                </div>
              )}

              {!isPrivate && (
                <div className="w-full border-t-4 border-black pt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <Mail size={18} className="text-[#3B82F6] shrink-0" />
                    <span className="truncate">{userData.email}</span>
                  </div>

                  <div className="flex items-center gap-3 font-bold text-sm">
                    <Hash size={18} className="text-[#3B82F6] shrink-0" />
                    <span className="truncate">{userData.rollno || 'N/A'}</span>
                  </div>

                  {userData.batch && isLoggedInViewer && (
                    <div className="flex items-center gap-3 font-bold text-sm">
                      <Layers size={18} className="text-[#3B82F6] shrink-0" />
                      <span>Batch {userData.batch}</span>
                    </div>
                  )}

                  {userData.group && isLoggedInViewer && (
                    <div className="flex items-center gap-3 font-bold text-sm">
                      <Hash size={18} className="text-[#3B82F6] shrink-0" />
                      <span>Group {userData.group}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <button
                disabled
                className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                title="Messaging disabled"
              >
                <MessageSquare size={24} className="text-black" />
                <span className="text-[10px] font-black uppercase tracking-widest">Message</span>
              </button>

              {isLoggedInViewer && !isPrivate ? (
                <a
                  href={`mailto:${userData.email}`}
                  className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Mail size={24} className="text-[#3B82F6]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6]">Email</span>
                </a>
              ) : (
                <button
                  disabled
                  className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                  title="Login to email this user"
                >
                  <Mail size={24} className="text-black" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                </button>
              )}

              <button
                disabled
                className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                title="Reporting disabled"
              >
                <ShieldAlert size={24} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Report</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="xl:col-span-2 flex flex-col justify-start gap-6 h-full">
            {isPrivate ? (
              <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center h-full text-center">
                <AlertTriangle size={80} className="mb-6 text-[#3B82F6]" />
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Profile is Private</h2>
                <p className="font-bold text-black/60 text-lg">This user has chosen not to share their profile publicly.</p>
              </div>
            ) : (
              <>
                {interests && interests.length > 0 && (
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl">Interests & Hobbies</h3>
                    <div className="flex flex-wrap gap-3">
                      {interests.map((interest, idx) => (
                        <div key={idx} className="bg-[#f4f4f5] text-black px-4 py-2 border-4 border-black font-black uppercase tracking-widest text-xs hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-transform cursor-default">
                          {interest}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(social?.github || social?.portfolio || social?.instagram || social?.linkedin || social?.hackerone || clubs?.nlogn) && (
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl">Social & Clubs</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                      {social?.github && (
                        <a href={`https://github.com/${social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                          <Github size={24} className="text-[#3B82F6] shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-xs uppercase tracking-widest text-black/60">GitHub</p>
                            <p className="font-black truncate text-sm">@{social.github}</p>
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
                            <p className="font-black truncate text-sm">@{social.linkedin}</p>
                          </div>
                        </a>
                      )}

                      {social?.instagram && (
                        <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                          <Instagram size={24} className="text-[#3B82F6] shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-xs uppercase tracking-widest text-black/60">Instagram</p>
                            <p className="font-black truncate text-sm">@{social.instagram}</p>
                          </div>
                        </a>
                      )}

                      {social?.hackerone && (
                        <a href={`https://hackerone.com/${social.hackerone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                          <Terminal size={24} className="text-[#3B82F6] shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-xs uppercase tracking-widest text-black/60">HackerOne</p>
                            <p className="font-black truncate text-sm">@{social.hackerone}</p>
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
                            <p className="font-black truncate text-sm">@{clubs.nlogn}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {(research?.orcid || (research?.papers && research.papers.length > 0)) && (
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl">Research</h3>
                    <div className="flex flex-col gap-4">

                      {research?.orcid && (
                        <a href={`https://orcid.org/${research.orcid}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-white">
                          <div className="flex items-center gap-4">
                            <Library size={32} className="text-[#3B82F6] shrink-0" />
                            <div className="overflow-hidden">
                              <p className="font-bold text-sm uppercase tracking-widest text-black/60">ORCID iD</p>
                              <p className="font-black break-all text-lg">{research.orcid}</p>
                            </div>
                          </div>
                          <div className="hidden sm:block text-black/40 font-bold uppercase tracking-widest text-xs">
                            View Profile &rarr;
                          </div>
                        </a>
                      )}

                      {research?.papers && research.papers.length > 0 && (
                        <div className="flex flex-col gap-4">
                          {research.papers.map((paper: {title: string, link: string}, idx: number) => (
                            paper.link ? (
                              <a key={idx} href={paper.link.startsWith('http') ? paper.link : `https://${paper.link}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-[#f4f4f5]">
                                <p className="font-bold text-base uppercase tracking-tight text-black group-hover:text-[#3B82F6] transition-colors">{paper.title}</p>
                                <p className="font-black text-xs uppercase tracking-widest text-black/50 mt-1 truncate">{paper.link.replace(/^https?:\/\//, '')}</p>
                              </a>
                            ) : (
                              <div key={idx} className="flex flex-col p-4 border-4 border-black bg-[#f4f4f5]">
                                <p className="font-bold text-base uppercase tracking-tight text-black">{paper.title}</p>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {social?.github && (
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase tracking-widest text-black mb-6 border-b-4 border-black pb-4 text-xl flex items-center gap-2">
                      <Github size={24} /> GitHub Overview
                    </h3>
                    
                    {githubLoading ? (
                      <div className="font-bold text-sm uppercase tracking-widest text-black/50">Loading GitHub data...</div>
                    ) : githubError ? (
                      <div className="font-bold text-sm uppercase tracking-widest text-red-500">Failed to load github profile data, {githubError}</div>
                    ) : githubData ? (
                      <div className="flex flex-col gap-6">
                        <div className="flex gap-4 flex-wrap">
                          <div className="flex-1 bg-[#f4f4f5] border-4 border-black p-4 text-center">
                            <p className="font-black text-2xl">{githubData.user.public_repos}</p>
                            <p className="font-bold text-xs uppercase tracking-widest text-black/50">Public Repos</p>
                          </div>
                          <div className="flex-1 bg-[#f4f4f5] border-4 border-black p-4 text-center">
                            <p className="font-black text-2xl">{githubData.user.followers}</p>
                            <p className="font-bold text-xs uppercase tracking-widest text-black/50">Followers</p>
                          </div>
                        </div>

                        <div className="border-4 border-black bg-[#f4f4f5] p-2 sm:p-4 overflow-x-auto w-full">
                           <p className="font-bold text-xs uppercase tracking-widest text-black/50 mb-4 pl-2">Contributions (Last Year)</p>
                           <img src={`https://ghchart.rshah.org/000000/${social.github}`} alt="GitHub Contribution Graph" className="w-full min-w-[600px] mix-blend-multiply" />
                        </div>

                        {githubData.repos && githubData.repos.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {githubData.repos.map((repo: any) => (
                              <a key={repo.name} href={`https://github.com/${repo.author}/${repo.name}`} target="_blank" rel="noopener noreferrer" className="flex flex-col p-4 border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] transition-all bg-[#f4f4f5] group">
                                <p className="font-bold text-base truncate group-hover:text-[#3B82F6] transition-colors">{repo.name}</p>
                                <p className="font-bold text-xs text-black/60 mt-1 line-clamp-2">{repo.description || 'No description'}</p>
                                <div className="flex items-center gap-4 mt-auto pt-4 text-xs font-black uppercase tracking-widest text-black/50">
                                  {repo.language && <span>{repo.language}</span>}
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
