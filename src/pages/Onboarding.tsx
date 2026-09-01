import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const [frame, setFrame] = useState(1);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const typeIndex = useRef(0);
  const talkingInterval = useRef<NodeJS.Timeout | null>(null);
  const sentenceIndexRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userName, setUserName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isFaculty, setIsFaculty] = useState(false);

  useEffect(() => {
    fetch('/api/check_status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          if (data.data.session_status === 'invalid_session') {
            navigate('/login');
            return;
          }
          if (data.data.user_status === 'active') {
            navigate('/dash');
            return;
          }
          if (data.data.first_name) {
            setUserName(data.data.first_name);
          }
          if (data.data.faculty) {
            setIsFaculty(true);
          }
        }
      })
      .catch(console.error);
  }, [navigate]);

  type StepType = 'none' | 'group' | 'about' | 'interests' | 'social_github' | 'social_linkedin' | 'social_instagram' | 'social_portfolio';
  const baseSteps: { text: string, type: StepType, facultySkip?: boolean }[] = [
    { text: `Hi${userName ? ' ' + userName : ''}, welcome to SST Hub! Let's get your profile set up.`, type: 'none' },
    { text: "First, what class group are you in?", type: 'group', facultySkip: true },
    { text: "Awesome! Tell us a little bit about yourself.", type: 'about' },
    { text: "Got it! What are your hobbies and interests?", type: 'interests' },
    { text: "Do you have a GitHub? Drop your username.", type: 'social_github', facultySkip: true },
    { text: "How about LinkedIn? What's your handle?", type: 'social_linkedin' },
    { text: "Any Instagram? For those aesthetic campus pics.", type: 'social_instagram', facultySkip: true },
    { text: "Finally, a Portfolio or HackerOne link?", type: 'social_portfolio' },
    { text: "Your profile is saved! You're all set to explore.", type: 'none' }
  ];

  const steps = baseSteps.filter(s => !(isFaculty && s.facultySkip));

  const [formData, setFormData] = useState({
    group: 'A',
    description: '',
    interests: [] as string[],
    github: '',
    linkedin: '',
    instagram: '',
    portfolio: '',
    hackerone: ''
  });
  const [interestInput, setInterestInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = interestInput.trim();
      if (val && formData.interests.length < 15 && !formData.interests.includes(val)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      setInterestInput('');
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const val = value.slice(0, -1).trim();
      if (val && formData.interests.length < 15 && !formData.interests.includes(val)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      setInterestInput('');
    } else {
      setInterestInput(value);
    }
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    document.title = 'Onboarding - SST Hub';
    
    // Preload character frames so they appear instantly when the animation starts
    const img1 = new Image();
    img1.src = '/chr_act/frame1.png';
    const img2 = new Image();
    img2.src = '/chr_act/frame2.png';
  }, []);

  const playBlip = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Only play blip ~60% of the time to make it sound less repetitive/mechanical
    if (Math.random() > 0.6) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use a sine wave instead of a square wave for a much softer, flute-like character voice (less robotic/buzzy)
    osc.type = 'sine';
    
    // Friendly, cheerful pitch base
    const baseFreq = 600;
    const jitter = baseFreq * 0.2; // 20% variation
    const freq = baseFreq + (Math.random() - 0.5) * jitter;
    
    // Start at freq, and slightly slide down (gives it a "spoken syllable" shape rather than a flat beep)
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + 0.1);

    // Envelope for Vowel Smoothing (soft attack and decay to remove harsh clicks)
    const duration = 0.08; // 80ms duration
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02); // Smooth attack, increased volume (from 0.15 to 0.8)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const startOnboarding = () => {
    // Initialize AudioContext on user interaction
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    
    // Unlock AudioContext for iOS/mobile Safari by playing a silent dummy sound immediately
    const dummyOsc = ctx.createOscillator();
    dummyOsc.frequency.value = 0;
    dummyOsc.connect(ctx.destination);
    dummyOsc.start(0);
    dummyOsc.stop(ctx.currentTime + 0.001);

    setStarted(true);
    
    setTimeout(() => {
      setShowIntro(true);
      
      // Wait for the fade-in and scale animations to complete before typing
      setTimeout(() => {
        startTyping();
      }, 1200); 
    }, 1000);
  };

  const startTyping = () => {
    setIsTalking(true);
    typeNextCharacter();
  };

  const typeNextCharacter = () => {
    const currentSentence = steps[sentenceIndexRef.current].text;
    if (typeIndex.current < currentSentence.length) {
      const char = currentSentence[typeIndex.current];
      setDisplayText(currentSentence.substring(0, typeIndex.current + 1));
      typeIndex.current++;

      let delay = 30; // Faster typing speed (1.2x to 1.4x)

      // Play blip for non-space characters
      if (char !== ' ') {
        playBlip();
      }

      // Add realistic pauses for punctuation
      if (char === '.' || char === '!' || char === '?') {
        delay = 200; // 200ms natural rest
        setIsTalking(false);
      } else if (char === ',') {
        delay = 150; // 150ms natural rest
        setIsTalking(false);
      } else {
        setIsTalking(true);
      }

      typingTimeoutRef.current = setTimeout(typeNextCharacter, delay);
    } else {
      setIsTalking(false);
      if (sentenceIndexRef.current < steps.length - 1) {
        setIsWaitingForNext(true);
      } else {
        setOnboardingComplete(true);
      }
    }
  };

  const handleNextSentence = async () => {
    if (isWaitingForNext && !isSaving) {
      const currentStep = steps[sentenceIndexRef.current];
      
      // Validation checks for compulsory fields
      if (currentStep.type === 'group' && !formData.group) return;
      if (currentStep.type === 'interests' && formData.interests.length === 0) return;

      if (currentStep.type === 'social_portfolio') {
        setIsSaving(true);
        try {
          const response = await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const result = await response.json();
          setIsSaving(false);
          if (result.status !== 'success') {
            alert(result.message || 'Error saving profile.');
            return;
          }
        } catch (error) {
          setIsSaving(false);
          alert('Network error. Please try again.');
          return;
        }
      }

      setIsWaitingForNext(false);
      const nextIndex = sentenceIndexRef.current + 1;
      setSentenceIndex(nextIndex);
      sentenceIndexRef.current = nextIndex;
      typeIndex.current = 0;
      setDisplayText('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      startTyping();
    }
  };

  // Character talking animation
  useEffect(() => {
    if (isTalking) {
      // Toggle frame every 120ms to allow smooth mouth movement independent of typing speed
      talkingInterval.current = setInterval(() => {
        setFrame(prev => prev === 1 ? 2 : 1);
      }, 120); 
    } else {
      setFrame(1);
      if (talkingInterval.current) {
        clearInterval(talkingInterval.current);
      }
    }

    return () => {
      if (talkingInterval.current) {
        clearInterval(talkingInterval.current);
      }
    };
  }, [isTalking]);

  return (
    <div className="min-h-screen bg-[#FFF5E1] text-black font-sans flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden relative">
      {/* Background Animated Grid */}
      <motion.div
        animate={{
          backgroundPosition: ['0px 0px', '40px 40px']
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear"
        }}
        className="absolute inset-0 opacity-[0.08] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, black 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      <AnimatePresence mode="wait">
        {/* Logo */}
        <div className={`absolute top-6 left-6 sm:top-10 sm:left-10 z-50 pointer-events-auto transition-opacity ${showIntro && steps[sentenceIndex]?.type !== 'none' ? 'max-md:opacity-0 max-md:pointer-events-none' : 'opacity-100'}`}>
          <div className="font-black text-2xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            SST<span className="text-white px-2 ml-1 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
          </div>
        </div>

        {!started ? (
          <motion.div
            key="start-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6"
          >
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center max-w-2xl">
              Welcome to <span className="text-[#3B82F6]">SST HUB</span>
            </h1>
            <p className="font-bold text-center text-black/70 max-w-lg mb-4">
              Get ready to set up your profile and explore the campus directory.
            </p>
            <button
              onClick={startOnboarding}
              className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-lg border-4 border-black hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all flex items-center gap-3"
            >
              Start Onboarding <ArrowRight size={24} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="intro-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 w-full h-[100dvh] overflow-hidden pointer-events-none z-10"
          >
            {showIntro && (
              <>
                {/* Character anchored to bottom right on desktop, bottom center on mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ opacity: { duration: 1.2, ease: "easeOut" }, y: { duration: 0.8, type: 'spring', bounce: 0.4 } }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 lg:right-24 h-[45vh] md:h-[65vh] flex items-end pointer-events-auto"
                >
                  <img
                    src="/chr_act/frame1.png"
                    alt="Zeo Idle"
                    className={`h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] filter saturate-150 origin-bottom ${frame === 1 ? 'block' : 'hidden'}`}
                  />
                  <img
                    src="/chr_act/frame2.png"
                    alt="Zeo Talking"
                    className={`h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] filter saturate-150 origin-bottom ${frame === 2 ? 'block' : 'hidden'}`}
                  />
                </motion.div>

                {/* Speech Bubble anchored just above character on mobile, middle-left on desktop */}
                {/* Speech Bubble anchored just above character on mobile, middle-left on desktop */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className={`absolute left-1/2 -translate-x-1/2 md:translate-x-0 bg-white pointer-events-auto transition-all duration-300 z-30 flex flex-col ${
                    steps[sentenceIndex].type !== 'none'
                      ? 'max-md:top-[50px] max-md:w-[100vw] max-md:h-[calc(100dvh-55vh)] max-md:border-0 max-md:shadow-none max-md:p-0 md:bottom-auto md:top-[20%] md:left-12 lg:left-24 md:w-[450px] lg:w-[600px] md:border-4 md:border-black md:p-10 md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]'
                      : 'bottom-[48vh] max-md:w-[90vw] max-md:border-4 max-md:border-black max-md:p-6 max-md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] md:bottom-auto md:top-[20%] md:left-12 lg:left-24 md:w-[450px] lg:w-[600px] md:border-4 md:border-black md:p-10 md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {/* Desktop pointer pointing bottom-right toward character */}
                  <div className="hidden md:block absolute -bottom-[32px] right-[40px] w-0 h-0 border-t-[32px] border-t-black border-l-[32px] border-l-transparent"></div>
                  <div className="hidden md:block absolute -bottom-[23px] right-[44px] w-0 h-0 border-t-[24px] border-t-white border-l-[24px] border-l-transparent z-10"></div>

                  {/* Mobile speech bubble pointer pointing bottom-left (hide when edge-to-edge) */}
                  <div className={`md:hidden absolute -bottom-[25px] left-10 w-0 h-0 border-t-[25px] border-t-black border-r-[20px] border-r-transparent ${steps[sentenceIndex].type !== 'none' ? 'hidden' : ''}`}></div>
                  <div className={`md:hidden absolute -bottom-[18px] left-[14px] w-0 h-0 border-t-[18px] border-t-white border-r-[15px] border-r-transparent z-10 ${steps[sentenceIndex].type !== 'none' ? 'hidden' : ''}`}></div>

                  <div className={`flex flex-col h-full max-h-[100%] overflow-y-auto pb-8 custom-scrollbar ${steps[sentenceIndex].type !== 'none' ? 'max-md:px-4 max-md:pt-4' : ''}`}>
                    <h3 className="font-black uppercase tracking-widest text-[#3B82F6] mb-1 text-sm shrink-0">Zeo</h3>
                    <p className="text-lg md:text-3xl font-bold leading-relaxed min-h-[40px] md:min-h-[80px] mb-3 shrink-0">
                      {displayText}
                      {isTalking && <span className="inline-block w-2 h-5 md:w-3 md:h-6 bg-black ml-1 animate-pulse"></span>}
                    </p>

                    {/* Interactive Input Sections - rendered only when Zeo finishes talking */}
                    {isWaitingForNext && steps[sentenceIndex].type !== 'none' && (
                      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col w-full">
                        {steps[sentenceIndex].type === 'group' && (
                          <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">Select your group *</label>
                            <select
                              name="group"
                              value={formData.group}
                              onChange={handleChange}
                              className="bg-white text-black border-4 border-black p-3 font-black text-xl outline-none focus:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] appearance-none cursor-pointer w-full"
                            >
                              <option value="A">Group A</option>
                              <option value="B">Group B</option>
                              <option value="C">Group C</option>
                              <option value="D">Group D</option>
                              <option value="E">Group E</option>
                            </select>
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'about' && (
                          <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">Bio (Max 150 chars)</label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              maxLength={150}
                              rows={3}
                              placeholder="I'm a developer building cool things..."
                              className="bg-white text-black border-4 border-black p-3 font-bold text-base outline-none focus:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none w-full"
                            />
                            <span className="text-xs font-bold text-black/50 text-right">{formData.description.length}/150</span>
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'interests' && (
                          <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">Type & press comma *</label>
                            <input
                              type="text"
                              placeholder="music, coding, design..."
                              value={interestInput}
                              onChange={handleInterestChange}
                              onKeyDown={handleInterestKeyDown}
                              className={`bg-white text-black border-4 border-black p-3 font-bold text-base outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full ${formData.interests.length === 0 ? 'focus:border-red-500' : 'focus:border-[#3B82F6]'}`}
                            />
                            {formData.interests.length === 0 && <span className="text-xs font-bold text-red-500">Please add at least one interest to continue!</span>}
                            {formData.interests.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.interests.map((interest, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-black text-white px-2 py-1 border-2 border-black font-black tracking-widest text-xs cursor-pointer" onClick={() => removeInterest(idx)}>
                                    <span className="uppercase">{interest}</span>
                                    <X size={12} className="text-white/50 hover:text-red-500" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'social_github' && (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">GitHub Username (Optional)</label>
                            <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden focus-within:border-[#3B82F6]">
                              <span className="bg-black text-white p-3 font-bold text-sm whitespace-nowrap hidden sm:block">github.com/</span>
                              <input type="text" name="github" value={formData.github} onChange={handleChange} placeholder="username" className="w-full p-3 font-bold text-sm outline-none" />
                            </div>
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'social_linkedin' && (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">LinkedIn Handle (Optional)</label>
                            <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden focus-within:border-[#3B82F6]">
                              <span className="bg-black text-white p-3 font-bold text-sm whitespace-nowrap hidden sm:block">linkedin.com/in/</span>
                              <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="handle" className="w-full p-3 font-bold text-sm outline-none" />
                            </div>
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'social_instagram' && (
                          <div className="flex flex-col gap-2 w-full">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">Instagram Handle (Optional)</label>
                            <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden focus-within:border-[#3B82F6]">
                              <span className="bg-black text-white p-3 font-bold text-sm whitespace-nowrap hidden sm:block">instagram.com/</span>
                              <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="handle" className="w-full p-3 font-bold text-sm outline-none" />
                            </div>
                          </div>
                        )}

                        {steps[sentenceIndex].type === 'social_portfolio' && (
                          <div className="flex flex-col gap-3 w-full">
                            <label className="font-bold text-sm uppercase tracking-widest text-black/70">Portfolio / HackerOne (Optional)</label>
                            <input type="text" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="Portfolio URL (e.g. yoursite.com)" className="bg-white text-black border-4 border-black p-3 font-bold text-sm outline-none focus:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full" />
                            <input type="text" name="hackerone" value={formData.hackerone} onChange={handleChange} placeholder="HackerOne Username" className="bg-white text-black border-4 border-black p-3 font-bold text-sm outline-none focus:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isWaitingForNext && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute -bottom-5 right-6 md:right-auto md:left-6 md:-bottom-6 cursor-pointer bg-black text-white px-6 py-2 md:py-3 border-4 border-black font-black uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 z-40 transform rotate-3 transition-all ${
                        ((steps[sentenceIndex].type === 'interests' && formData.interests.length === 0) || isSaving)
                          ? 'opacity-50 pointer-events-none' 
                          : 'hover:rotate-0 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]'
                      }`}
                      onClick={handleNextSentence}
                    >
                      {isSaving ? 'Saving...' : (
                        <>Next <ArrowRight size={16} /></>
                      )}
                    </motion.div>
                  )}

                  {onboardingComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -bottom-5 right-6 md:right-auto md:left-6 md:-bottom-6 cursor-pointer bg-[#3B82F6] text-white px-6 py-2 md:py-3 border-4 border-black font-black uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 z-40 transform rotate-2 hover:rotate-0 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      onClick={() => navigate('/dash')}
                    >
                      Finish <ArrowRight size={16} />
                    </motion.div>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
