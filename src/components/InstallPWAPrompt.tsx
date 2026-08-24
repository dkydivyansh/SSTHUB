import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return; // Already installed and running as PWA
    }

    // Check localStorage for dismissal
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt, 10) < oneWeek) {
        return; // Dismissed less than a week ago
      }
    }

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setShowPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).deferredPrompt = promptEvent;
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up.
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      // Record dismissal if they explicitly clicked cancel on the native prompt
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="relative w-full bg-[#3B82F6] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden flex-shrink-0"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 bg-red-500 border-2 border-black p-1 hover:scale-110 transition-transform cursor-pointer z-10"
          >
            <X size={16} className="text-white" strokeWidth={3} />
          </button>
          
          <div className="flex items-start gap-4 pr-8 w-full sm:w-auto">
            <div className="bg-white border-2 border-black p-2 flex-shrink-0 hidden sm:block">
              <Download className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-white text-lg leading-tight mb-1">
                Install SSTHub
              </h3>
              <p className="text-white/90 text-xs font-bold uppercase tracking-wider leading-relaxed">
                Add to your home screen for a faster, app-like experience and offline access!
              </p>
            </div>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto flex-shrink-0 whitespace-nowrap px-6 bg-yellow-400 border-2 border-black py-3 font-black uppercase tracking-widest text-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-sm"
          >
            Install App
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
