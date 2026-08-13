import Hero from '../components/Hero';
import MarqueeBanner from '../components/MarqueeBanner';
import BentoGrid from '../components/BentoGrid';
import InteractiveCards from '../components/InteractiveCards';
import Footer from '../components/Footer';
import Lenis from 'lenis';
import { useEffect } from 'react';
export default function Home() {
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
