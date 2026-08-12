import { motion } from 'motion/react';
import { Mail } from 'lucide-react';

export default function Footer() {
  const bgColor = 'bg-blue-500';

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`w-full ${bgColor} p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 border-t-4 border-black transition-colors duration-500`}
    >
      <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
        <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight uppercase">Need Assistance?</h2>
        <p className="text-black font-bold border-b-4 border-black inline-block">Contact the administration or IT support desk.</p>
        <p className="text-black/80 font-bold text-sm mt-4 uppercase tracking-widest">Not affiliated with Scaler School of Technology</p>
      </div>
      
      <button className="px-8 py-4 bg-black text-white font-black hover:bg-white hover:text-black border-4 border-black transition-colors flex items-center gap-3 w-full md:w-auto justify-center uppercase shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1">
        <Mail size={24} /> Contact Support
      </button>
    </motion.footer>
  );
}
