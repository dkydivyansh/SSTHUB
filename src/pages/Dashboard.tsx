import { motion } from 'motion/react';

export default function Dashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="bg-white border-4 border-black p-12 lg:p-24 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-4 h-4 bg-[#EE5455] border-2 border-black rounded-full animate-ping"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 bg-black border-2 border-black rounded-none"></div>

        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter text-black mb-4 transform -rotate-2">
          COMMING <br/> <span className="text-[#EE5455]">SOON</span>
        </h1>
        
        <p className="text-lg md:text-2xl font-bold uppercase tracking-widest text-black/60 mt-8 border-t-4 border-black pt-8">
          Something awesome is being built here.
        </p>
      </div>
    </motion.div>
  );
}
