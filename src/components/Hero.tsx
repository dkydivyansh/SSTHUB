import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { ArrowRight, BookOpen, Star, X } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deferredPrompt) {
      setShowIOSModal(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const scrollY1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const scrollY2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Mouse interactivity
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5; // -0.5 to 0.5
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const springConfig = { damping: 30, stiffness: 100, mass: 0.5 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  const x1 = useTransform(mouseXSpring, [-0.5, 0.5], [-40, 40]);
  const y1 = useTransform(mouseYSpring, [-0.5, 0.5], [-40, 40]);

  const x2 = useTransform(mouseXSpring, [-0.5, 0.5], [60, -60]);
  const y2 = useTransform(mouseYSpring, [-0.5, 0.5], [60, -60]);

  const textX = useTransform(mouseXSpring, [-0.5, 0.5], [-15, 15]);
  const textY = useTransform(mouseYSpring, [-0.5, 0.5], [-15, 15]);

  const colors = {
    bg: 'bg-[#FFF5E1]',
    shape1: 'bg-[#3B82F6]',
    shape2: 'bg-blue-500',
    highlight: 'bg-blue-500 text-white',
    btnShadow: 'shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]',
    btnHoverShadow: 'hover:shadow-[0px_0px_0px_0px_rgba(59,130,246,1)]',
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen flex flex-col items-center justify-center ${colors.bg} overflow-hidden border-b-4 border-black py-16 lg:py-24 transition-colors duration-500`}
    >
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

      {/* Logo */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-50">
        <div className="font-black text-2xl text-black tracking-tight uppercase whitespace-nowrap bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          SST<span className="text-white px-2 ml-1 border-2 border-black rotate-2 inline-block bg-[#3B82F6]">Hub</span>
        </div>
      </div>

      {/* Decorative Interactive shapes */}
      <motion.div 
        style={{ x: x1, y: y1 }}
        className="absolute bottom-32 sm:bottom-48 left-8 sm:left-24 z-0 hidden sm:block pointer-events-none"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`w-20 h-20 sm:w-28 sm:h-28 ${colors.shape1} border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
        />
      </motion.div>

      <motion.div 
        style={{ x: x2, y: y2 }}
        className="absolute top-40 sm:top-52 right-8 sm:right-24 z-0 hidden sm:block pointer-events-none"
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${colors.shape2} border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center`}
        >
          <Star size={40} className="text-black" />
        </motion.div>
      </motion.div>
      
      {/* Background large text for creative depth */}
      <motion.div 
        style={{ x: textX, y: textY }}
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-[0.04] z-0"
      >
        <h1 className="text-[12rem] sm:text-[20rem] font-black text-black whitespace-nowrap tracking-tighter transform -rotate-6">
          SST PORTAL
        </h1>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 w-full flex flex-col items-center text-center">
        <motion.div 
          style={{ opacity, y: scrollY1 }}
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: "spring", bounce: 0.4 }}
          className="flex flex-col items-center"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="inline-flex items-center gap-2 mb-8 px-6 py-2 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm sm:text-base font-black tracking-widest uppercase cursor-default"
          >
            <BookOpen size={18} className="text-black" />
            Scaler School of Technology
          </motion.div>
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black text-black tracking-tighter leading-none mb-8 uppercase break-words relative">
            <span className="relative z-10">Student</span> <br />
            <span className={`relative z-20 inline-block ${colors.highlight} px-6 py-2 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 mt-4 transition-colors duration-500`}>
              Portal
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-12">
            <Link to="/login" className="inline-block">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(59,130,246,1)] transition-all text-sm flex items-center gap-2 relative group cursor-pointer`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open Portal <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 w-0 bg-blue-500 transition-all duration-300 ease-out group-hover:w-full z-0" />
              </motion.div>
            </Link>
            
            {!isInstalled && (
              <button onClick={handleInstallClick} className="inline-block outline-none">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 bg-[#FFF5E1] text-black font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all text-sm flex items-center gap-2 relative cursor-pointer`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Install App
                  </span>
                </motion.div>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowIOSModal(false)}>
          <div className="bg-[#FFF5E1] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowIOSModal(false)} className="absolute top-3 right-3 hover:-translate-y-1 transition-transform p-1 bg-white border-2 border-black">
               <X size={20} />
            </button>
            <h3 className="font-black uppercase tracking-tighter text-2xl mb-4 text-black">Manual Install</h3>
            <p className="font-bold text-gray-700 text-sm mb-6 leading-relaxed">
              To install this app on your device:
              <br/><br/>
              <strong>iOS (Safari):</strong> Tap the <span className="inline-flex items-center justify-center border-2 border-black px-1.5 py-0.5 mx-1 bg-white text-[10px] uppercase tracking-widest leading-none">Share</span> icon at the bottom of your screen, then scroll down and select <span className="inline-flex items-center justify-center border-2 border-black px-1.5 py-0.5 mx-1 bg-white text-[10px] uppercase tracking-widest leading-none">Add to Home Screen</span>.
              <br/><br/>
              <strong>Other Browsers:</strong> Look for the "Install" or "Add to Home Screen" option in your browser's options menu.
            </p>
            <button onClick={() => setShowIOSModal(false)} className="w-full bg-black text-white py-3 font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:-translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(59,130,246,1)] transition-all">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
