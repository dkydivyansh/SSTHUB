import { Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full relative z-10 border-t-4 border-black font-sans">
      {/* Top Assistance Banner */}
      <div className="bg-[#3B82F6] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-black">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight uppercase">Need Assistance?</h2>
          <p className="text-black font-bold text-base">Contact the administration or IT support desk.</p>
        </div>
        
        <a 
          href="mailto:support-sst-hub@dkydivyansh.com" 
          className="px-8 py-4 bg-black text-white font-black hover:bg-white hover:text-black border-4 border-black transition-all flex items-center gap-3 w-full md:w-auto justify-center uppercase shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 cursor-pointer"
        >
          <Mail size={22} /> Contact Support
        </a>
      </div>

      {/* Bottom Footer Bar */}
      <div className="bg-black text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
          <span>SST HUB</span>
          <span>•</span>
          <Link to="/coc" className="hover:text-[#3B82F6] underline decoration-2 transition-colors">
            Code of Conduct
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-300">Made by</span>
          <a
            href="https://dkydivyansh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black px-3 py-1 border-2 border-black font-black hover:bg-[#3B82F6] hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] inline-flex items-center gap-1.5"
          >
            dkydivyansh <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
}
