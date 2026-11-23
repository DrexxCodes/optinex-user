import { isSignedIn } from '@/lib/auth/session';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustBar from '@/components/landing/TrustBar';
import Ecosystem from '@/components/landing/Ecosystem';
import PlatformShowcase from '@/components/landing/PlatformShowcase';
import CtaBanner from '@/components/landing/CtaBanner';
import Testimonials from '@/components/landing/Testimonials';
import Faq from '@/components/landing/Faq';
import Footer from '@/components/landing/Footer';

// This is the app entry point. It renders for everyone — signed in or not —
// the navbar just adapts. `isSignedIn()` only reads the httpOnly session cookies
// (no database access) — it adapts the UI and never grants access to anything.
export default async function MarketingLandingPage() {
  const signedIn = await isSignedIn();

  return (
    <main className="relative min-h-screen bg-frost">
      <div className="app-background" />
      <Navbar authenticated={signedIn} />
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
