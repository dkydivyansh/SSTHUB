import { motion } from 'motion/react';

export default function MarqueeBanner() {
  const text = "• SCALER SCHOOL OF TECHNOLOGY • ACADEMIC EXCELLENCE • STUDENT PORTAL ";
  
  const bgColor = 'bg-blue-500 text-white';
  
  return (
    <div className={`w-full ${bgColor} border-b-4 border-black py-4 overflow-hidden flex relative z-20 transition-colors duration-500`}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="flex whitespace-nowrap font-black text-xl sm:text-2xl uppercase tracking-widest text-white"
      >
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
      </motion.div>
    </div>
  );
}
