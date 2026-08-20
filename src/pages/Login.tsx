import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export default function Login() {
  const [animationData, setAnimationData] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');

  useEffect(() => {
    document.title = 'Login - SST Hub';
    fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          navigate('/dash');
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleGoogleLogin = () => {
    const clientId = '395027667845-rnn22t43fi63jqoj6muqalemp1gt0ugs.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = encodeURIComponent('email profile openid');
    const state = encodeURIComponent(redirectUri);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=online&state=${state}`;

    window.location.href = authUrl;
  };

  useEffect(() => {
    fetch('/death-dance.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Error loading animation:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row font-sans w-full overflow-hidden relative">
      {/* Left Side: Dark Background with Animation */}
      <div className="w-full lg:w-1/2 bg-black relative flex flex-col items-center justify-center p-8 lg:p-12 min-h-[50vh] lg:min-h-screen border-t-4 lg:border-t-0 lg:border-r-4 border-black">
        {/* Back Button (Desktop) */}
        <Link
          to="/"
          className="hidden lg:inline-flex absolute top-10 left-10 items-center gap-2 font-black uppercase tracking-widest text-white hover:text-[#3B82F6] transition-colors z-20"
        >
          <ArrowLeft size={20} /> Back
        </Link>

        {/* Large Typography Decoration */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-[0.05] z-0">
          <h1 className="text-[10rem] lg:text-[15rem] font-black text-white whitespace-nowrap tracking-tighter transform -rotate-12">
            SST HUB
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="w-full max-w-md relative z-10 flex items-center justify-center -mt-10 lg:-mt-0"
        >
          <div className="relative z-10 w-full">
            {animationData ? (
              <Lottie
                animationData={animationData}
                loop={true}
                className="w-full drop-shadow-[0_0_20px_rgba(238,84,85,0.1)]"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center font-bold text-white/50">
                Loading Animation...
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 bg-[#FFF5E1] relative flex items-center justify-center p-8 pt-20 lg:p-12 min-h-[50vh] lg:min-h-screen">
        {/* Back Button (Mobile) */}
        <Link
          to="/"
          className="lg:hidden absolute top-6 left-6 inline-flex items-center gap-2 font-black uppercase tracking-widest text-black hover:text-[#3B82F6] transition-colors z-20"
        >
          <ArrowLeft size={20} /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: 'spring', delay: 0.2 }}
          className="w-full max-w-md flex flex-col relative z-10"
        >
          <div className="bg-white border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            {/* Decorative Tag */}
            <div className="absolute -top-5 -right-5 bg-[#3B82F6] text-white px-4 py-2 border-4 border-black font-black uppercase tracking-widest text-sm transform rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Secure
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2">
                Welcome
              </h1>
              <p className="text-[#3B82F6] font-black uppercase tracking-widest text-xs mb-2">
                Important: Only @sst.scaler.com emails allowed
              </p>
              <p className="text-black/70 font-bold uppercase tracking-widest text-sm">
                Sign in to SST Hub
              </p>
            </div>

            {errorParam && (
              <div className="mb-6 bg-black text-white p-4 font-bold border-4 border-[#3B82F6] text-center shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] uppercase tracking-wider text-sm">
                {errorParam}
              </div>
            )}

            <div className="flex flex-col gap-5">
              <button
                onClick={handleGoogleLogin}
                className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-black uppercase tracking-widest border-4 border-black py-4 px-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {/* Google Logo SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.71 17.6V20.34H19.27C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.71 17.6C14.73 18.26 13.47 18.66 12 18.66C9.16 18.66 6.75 16.74 5.88 14.18H2.21V17.03C4.01 20.61 7.7 23 12 23Z" fill="#34A853"/>
                  <path d="M5.88 14.18C5.66 13.52 5.53 12.78 5.53 12C5.53 11.22 5.66 10.48 5.88 9.82V6.97H2.21C1.47 8.44 1.05 10.15 1.05 12C1.05 13.85 1.47 15.56 2.21 17.03L5.88 14.18Z" fill="#FBBC05"/>
                  <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.99L19.34 3.86C17.45 2.1 14.97 1 12 1C7.7 1 4.01 3.39 2.21 6.97L5.88 9.82C6.75 7.26 9.16 5.34 12 5.34Z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t-4 border-black text-center flex flex-col gap-4">
              <p className="text-sm font-bold text-black/70">
                By signing in, you agree to the <br />{' '}
                <Link
                  to="/coc"
                  className="text-black font-black underline decoration-2 cursor-pointer hover:text-[#3B82F6] transition-colors"
                >
                  Student Code of Conduct
                </Link>
                .
              </p>

              <div className="pt-3 border-t-2 border-black/10 flex items-center justify-center gap-2 text-xs font-bold text-black/70">
                <span className="uppercase tracking-widest text-[11px]">Made by</span>
                <a
                  href="https://dkydivyansh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black text-white px-2.5 py-1 border-2 border-black font-black hover:bg-[#3B82F6] hover:text-white transition-all inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  dkydivyansh <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
