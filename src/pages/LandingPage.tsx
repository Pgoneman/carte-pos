import { HeroSection } from '../components/landing/HeroSection';
import { PainPointSection } from '../components/landing/PainPointSection';
import { SocialProofSection } from '../components/landing/SocialProofSection';
import { BetaSignupForm } from '../components/landing/BetaSignupForm';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <PainPointSection />
      <SocialProofSection />
      <BetaSignupForm />

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-brand-warm py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-display text-brand-cream text-xl mb-2">Carte</p>
          <p className="text-brand-muted text-sm font-body">
            AYCE Korean BBQ 전용 POS 시스템
          </p>
          <p className="text-brand-muted text-xs font-body mt-4">
            &copy; 2025 Carte. Built for Korean BBQ restaurants in America.
          </p>
        </div>
      </footer>
    </div>
  );
}
