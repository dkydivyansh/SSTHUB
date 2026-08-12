import { motion, useScroll, useTransform } from 'motion/react';
import { Layers, Terminal, Cpu, Zap, Globe, Asterisk } from 'lucide-react';
import { useRef } from 'react';

export default function InteractiveCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yRightSide = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const colors = {
    bgLeft: 'bg-white',
    bgRight: 'bg-[#FFF5E1]',
    itemHover1: 'hover:bg-blue-400 group-hover:text-white',
    itemHover2: 'hover:bg-[#EE5455] group-hover:text-white',
    itemHover3: 'hover:bg-blue-400 group-hover:text-white',
    itemHover4: 'hover:bg-[#EE5455] group-hover:text-white',
    iconShadow: 'shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]',
    highlightText: 'bg-blue-500 text-white',
  };

  const items = [
    { title: "Practical Mastery", desc: "Build real-world projects from day one.", hover: colors.itemHover1, Icon: Terminal, tag: "01", rotation: "-rotate-1" },
    { title: "Industry Vetted", desc: "Curriculum designed by tech leaders.", hover: colors.itemHover2, Icon: Cpu, tag: "02", rotation: "rotate-2" },
    { title: "Peer Network", desc: "Collaborate with top engineering minds.", hover: colors.itemHover3, Icon: Globe, tag: "03", rotation: "rotate-2" },
    { title: "Continuous Innovation", desc: "Stay ahead of the technology curve.", hover: colors.itemHover4, Icon: Zap, tag: "04", rotation: "-rotate-1" },
  ];

  return (
    <div ref={containerRef} className={`flex flex-col lg:flex-row overflow-hidden border-b-4 border-black min-h-[500px]`}>
      {/* Left Side */}
      <div className={`lg:w-1/3 p-10 lg:p-16 flex flex-col justify-center border-b-4 lg:border-b-0 lg:border-r-4 border-black ${colors.bgLeft} relative z-10 transition-colors duration-500`}>
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <div className={`w-16 h-16 bg-black text-white flex items-center justify-center rounded-full mb-8 ${colors.iconShadow} transition-colors duration-500`}>
            <Layers size={32} />
          </div>
          <h2 className="text-5xl lg:text-7xl font-black text-black mb-6 leading-[0.9] uppercase">
            The <br /> Scaler <br /> Way
          </h2>
          <p className={`text-xl font-bold text-black border-l-4 border-black pl-4 ${colors.highlightText} py-2 px-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors duration-500`}>
            Our core philosophy.
          </p>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className={`lg:w-2/3 p-6 sm:p-10 lg:p-16 flex items-center justify-center relative overflow-hidden ${colors.bgRight} transition-colors duration-500`}>
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 2px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Decorative Spinning Shape */}
        <motion.div 
           animate={{ rotate: 360 }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute -top-10 -right-10 opacity-10 pointer-events-none"
        >
          <Asterisk size={240} className="text-black" />
        </motion.div>

        <motion.div style={{ y: yRightSide }} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.5 }}
              whileHover={{ scale: 1.05, rotate: 0 }}
              className={`group relative flex flex-col p-6 sm:p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${item.hover} ${item.rotation} cursor-default transition-all duration-300`}
            >
              {/* Tag */}
              <div className="absolute -top-4 -right-4 bg-black text-white font-black px-3 py-1 text-lg border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transform rotate-12 group-hover:rotate-0 transition-transform">
                {item.tag}
              </div>

              <div className="w-14 h-14 mb-6 bg-white border-4 border-black rounded-full flex shrink-0 items-center justify-center group-hover:-rotate-12 group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <item.Icon size={24} className="text-black" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-tight group-hover:text-black leading-none">{item.title}</h3>
                <p className="text-black font-bold group-hover:text-black opacity-80 leading-snug">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
