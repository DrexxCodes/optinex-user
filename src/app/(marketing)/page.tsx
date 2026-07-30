import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustBar from '@/components/landing/TrustBar';
import Ecosystem from '@/components/landing/Ecosystem';
import PlatformShowcase from '@/components/landing/PlatformShowcase';
import CtaBanner from '@/components/landing/CtaBanner';
import Testimonials from '@/components/landing/Testimonials';
import Faq from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';

export default function MarketingLandingPage() {
  return (
    <main className="relative min-h-screen bg-frost">
      <div className="app-background" />
      <Navbar />
      <Hero />
      <TrustBar />
      <Ecosystem />
      <PlatformShowcase />
      <CtaBanner />
      <Testimonials />
      <Faq />
      <Footer />
    </main>
  );
}
