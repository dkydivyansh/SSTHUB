import Hero from '../components/Hero';
import MarqueeBanner from '../components/MarqueeBanner';
import BentoGrid from '../components/BentoGrid';
import InteractiveCards from '../components/InteractiveCards';
import Footer from '../components/Footer';
import Lenis from 'lenis';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'SST Hub';
    fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          navigate('/dash');
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FFF5E1]">
      <main className="flex-1 flex flex-col overflow-x-hidden">
        <Hero />
        <MarqueeBanner />
        <BentoGrid />
        <InteractiveCards />
      </main>

      <Footer />
    </div>
  );
}
