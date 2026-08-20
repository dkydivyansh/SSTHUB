import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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

  const sentences = [
    "Hi, I'm Joe!",
    "I'm happy to welcome you to the SST Hub.",
    "I'll be your guide.",
    "Let's get you set up and ready to explore!"
  ];

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

    // Only play blip 50% of the time to make it sound less mechanical
    if (Math.random() > 0.5) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Try a deeper, more retro speech blip sound
    osc.type = 'square';
    // Pitch Variation (Jitter): 10% to 15%. Lowered base to 500Hz for deeper voice.
    const baseFreq = 500;
    const jitter = baseFreq * 0.15; // Max 15% variation
    osc.frequency.setValueAtTime(baseFreq + (Math.random() - 0.5) * jitter, ctx.currentTime);

    // Envelope for Vowel Smoothing and 60-80ms duration
    const duration = 0.07; // 70ms duration
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02); // Smooth attack
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
    const currentSentence = sentences[sentenceIndexRef.current];
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
      if (sentenceIndexRef.current < sentences.length - 1) {
        setIsWaitingForNext(true);
      } else {
        setOnboardingComplete(true);
      }
    }
  };

  const handleNextSentence = () => {
    if (isWaitingForNext) {
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
        <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-50 pointer-events-auto">
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
                  transition={{ duration: 0.8, type: 'spring' }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 lg:right-24 h-[45vh] md:h-[65vh] flex items-end pointer-events-auto"
                >
                  <img
                    src="/chr_act/frame1.png"
                    alt="Joe Idle"
                    className={`h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] filter saturate-150 origin-bottom ${frame === 1 ? 'block' : 'hidden'}`}
                  />
                  <img
                    src="/chr_act/frame2.png"
                    alt="Joe Talking"
                    className={`h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] filter saturate-150 origin-bottom ${frame === 2 ? 'block' : 'hidden'}`}
                  />
                </motion.div>

                {/* Speech Bubble anchored just above character on mobile, middle-left on desktop */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="absolute bottom-[48vh] md:bottom-auto top-auto md:top-[20%] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-12 lg:left-24 w-[90vw] md:w-[450px] lg:w-[600px] bg-white border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] pointer-events-auto z-20"
                >
                  {/* Desktop pointer pointing bottom-right toward character */}
                  <div className="hidden md:block absolute -bottom-[32px] right-[40px] w-0 h-0 border-t-[32px] border-t-black border-l-[32px] border-l-transparent"></div>
                  <div className="hidden md:block absolute -bottom-[23px] right-[44px] w-0 h-0 border-t-[24px] border-t-white border-l-[24px] border-l-transparent z-10"></div>

                  {/* Mobile speech bubble pointer pointing bottom-left */}
                  <div className="md:hidden absolute -bottom-[25px] left-10 w-0 h-0 border-t-[25px] border-t-black border-r-[20px] border-r-transparent"></div>
                  <div className="md:hidden absolute -bottom-[18px] left-[14px] w-0 h-0 border-t-[18px] border-t-white border-r-[15px] border-r-transparent z-10"></div>

                  <h3 className="font-black uppercase tracking-widest text-[#3B82F6] mb-2 text-sm">Joe</h3>
                  <p className="text-xl md:text-3xl font-bold leading-relaxed min-h-[120px]">
                    {displayText}
                    {isTalking && <span className="inline-block w-3 h-6 bg-black ml-1 animate-pulse"></span>}
                  </p>

                  {isWaitingForNext && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-6 right-6 cursor-pointer text-[#3B82F6] hover:text-black transition-colors"
                      onClick={handleNextSentence}
                    >
                      <span className="font-black uppercase tracking-widest text-sm flex items-center gap-1 animate-bounce">
                        Next <ArrowRight size={16} />
                      </span>
                    </motion.div>
                  )}

                  {onboardingComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 flex justify-end"
                    >
                      <button
                        onClick={() => navigate('/dash')}
                        className="bg-[#3B82F6] text-white px-6 py-3 font-black uppercase tracking-widest border-4 border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        Continue to Dashboard
                      </button>
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
