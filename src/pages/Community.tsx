import { Globe } from 'lucide-react';

export default function Community() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto h-[80vh] items-center justify-center">
      <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center gap-6">
        <div className="bg-[#3B82F6] text-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          <Globe size={64} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Community</h1>
        <p className="text-xl font-bold max-w-md border-t-4 border-black pt-6">
          This space is currently under construction. Check back soon for community features!
        </p>
      </div>
    </div>
  );
}
