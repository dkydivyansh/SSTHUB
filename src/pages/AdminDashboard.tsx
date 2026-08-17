import { useOutletContext, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const { userData } = useOutletContext<any>();

  if (userData?.type !== 'admin') {
    return <Navigate to="/dash" replace />;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto min-h-[80vh]">
      <div className="flex items-center gap-4 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-red-500 text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          <ShieldAlert size={48} />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Admin Dashboard</h1>
          <p className="font-bold text-black/60 uppercase tracking-widest text-sm mt-1">System Management</p>
        </div>
      </div>
      
      <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center flex-1">
        <p className="text-xl font-bold max-w-md">
          Admin portal is currently under construction. Administrative tools will appear here.
        </p>
      </div>
    </div>
  );
}
