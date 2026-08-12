import { motion, useScroll, useTransform } from 'motion/react';
import { Terminal, Lightbulb, Users, Rocket, Crosshair } from 'lucide-react';
import { useRef } from 'react';

export default function BentoGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const colors = {
    bg: 'bg-[#EE5455]',
    accent: 'bg-blue-500',
    accentShadow: 'shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]',
    cardBg: 'bg-[#FFF5E1]',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div ref={containerRef} className={`${colors.bg} py-16 lg:py-24 border-b-4 border-black px-4 sm:px-6 relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative background shapes */}
      <motion.div 
        style={{ y: y1, rotate: rotate1 }}
        className="absolute -right-20 top-20 opacity-20 pointer-events-none"
      >
        <Crosshair size={300} className="text-black" strokeWidth={1} />
      </motion.div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 2px, transparent 0)', backgroundSize: '32px 32px' }}></div>

      <div className="max-w-6xl mx-auto mb-10 text-center sm:text-left relative z-10">
        <h2 className="text-4xl sm:text-5xl font-black text-black uppercase tracking-tight border-b-4 border-black inline-block pb-2">Culture & Community</h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-auto md:auto-rows-[200px]"
      >
        {/* Ethos Cell */}
        <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2 bg-white border-4 border-black p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1 transition-transform">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 ${colors.accent} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors duration-500`}>
              <Terminal size={32} className="text-black" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-black">The Builder's Ethos</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <div className={`p-6 sm:p-8 ${colors.cardBg} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-all duration-500`}>
               <h4 className="font-black text-xl sm:text-2xl uppercase text-black mb-4 leading-tight">
                 "We don't just consume technology, we engineer it."
               </h4>
               <p className="text-sm sm:text-base font-bold text-black border-l-4 border-black pl-4">
                 Our campus is a sandbox for the ambitious. From late-night debugging sessions to deploying world-class systems.
               </p>
             </div>
          </div>
        </motion.div>

        {/* Lab Cell */}
        <motion.div variants={itemVariants} className={`md:col-span-2 md:row-span-1 ${colors.accent} border-4 border-black p-6 sm:p-8 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-colors cursor-default group duration-500`}>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-black mb-2">Innovation Lab</h3>
            <p className={`font-bold uppercase text-black bg-white px-2 py-1 border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:${colors.accent} transition-colors duration-500`}>Status: Active Experiments</p>
          </div>
          <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:-rotate-12 transition-transform">
            <Lightbulb size={28} className="text-black fill-black" />
          </div>
        </motion.div>

        {/* Community Cell */}
        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 bg-white border-4 border-black p-6 sm:p-8 flex flex-col justify-center items-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform cursor-default">
          <div className="text-black mb-2 flex items-center gap-2">
            <Users size={20} className="fill-black" />
            <span className="font-black text-lg uppercase">Cohort</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-black">Top 1%</div>
        </motion.div>

        {/* Action Cell */}
        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 bg-black border-4 border-black p-6 sm:p-8 flex flex-col justify-center items-center group cursor-default shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors">
           <div className={`w-14 h-14 bg-white border-4 border-black flex items-center justify-center rounded-full mb-4 ${colors.accentShadow} group-hover:bg-black group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-500`}>
             <Rocket className="text-black group-hover:text-white" size={28} />
           </div>
           <div className="text-white group-hover:text-black font-black uppercase text-xl text-center leading-tight">Launch <br/> Ideas</div>
        </motion.div>

      </motion.div>
    </div>
  );
}
