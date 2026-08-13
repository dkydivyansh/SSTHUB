import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

export default function PageLoader() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const prevLocRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevLocRef.current) {
      setIsLoading(true);
      setShowCloseBtn(false);
      prevLocRef.current = location.pathname;
      
      // minimum show time of 1.5s to enjoy the animation
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      
      // show close button after 3s as fallback
      const closeTimer = setTimeout(() => {
        setShowCloseBtn(true);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#FFF5E1] flex flex-col items-center justify-center pointer-events-auto overflow-hidden border-black border-y-8"
        >
          {/* Background Decorative Elements */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, black 2px, transparent 0)', 
              backgroundSize: '40px 40px' 
            }} 
          />
          
          <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.5 }}
              className="w-56 h-56 sm:w-80 sm:h-80 flex items-center justify-center mb-6"
            >
              <motion.img 
                src="/Loader.svg" 
                alt="Loading" 
                className="w-full h-full object-contain"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-black flex items-center">
                SST<span className="text-white px-2 py-1 ml-2 border-4 border-black rotate-2 inline-block bg-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Hub</span>
              </h2>
              
              {showCloseBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIsLoading(false)}
                  className="mt-10 px-8 py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
                >
                  Enter
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
