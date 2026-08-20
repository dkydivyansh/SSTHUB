import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      // If we come back online via the event, reload the page
      window.location.reload();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    let retryInterval: NodeJS.Timeout;

    if (isOffline) {
      retryInterval = setInterval(async () => {
        setIsChecking(true);
        try {
          // Attempt to fetch the favicon to verify actual connection
          const response = await fetch('/favicon.ico?cache_bust=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
          if (response.ok) {
            // Connection restored!
            window.location.reload();
          }
        } catch (error) {
          // Still offline
        } finally {
          setIsChecking(false);
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [isOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#FFF5E1] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-full max-w-md bg-white border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center">
            {/* Warning Tape */}
            <div className="absolute top-0 left-0 w-[150%] h-4 bg-yellow-400 border-b-4 border-black -rotate-3 transform -translate-x-4 -translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-[150%] h-4 bg-yellow-400 border-t-4 border-black -rotate-3 transform translate-x-4 translate-y-1"></div>
            
            <div className="w-20 h-20 bg-red-100 border-4 border-black rounded-full flex items-center justify-center mb-6 relative">
              <WifiOff className="w-10 h-10 text-red-600" strokeWidth={2.5} />
              <div className="absolute -inset-2 border-2 border-red-600 rounded-full animate-ping opacity-20"></div>
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tighter text-black mb-4">
              NO CONNECTION
            </h1>
            
            <p className="text-sm md:text-base font-bold uppercase tracking-widest text-black/70 mb-8 leading-relaxed">
              It looks like you're disconnected from the grid. We're continuously checking for a signal.
            </p>

            <div className="flex items-center gap-3 bg-gray-100 border-2 border-black px-6 py-3">
              <Loader2 className="w-5 h-5 text-black animate-spin" />
              <span className="font-black uppercase tracking-widest text-xs md:text-sm">
                {isChecking ? 'Ping...' : 'Retrying in 2s...'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
