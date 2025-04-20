import React, { useState, useEffect } from 'react';
import OnboardingModal from '@/components/OnboardingModal';
import { walletService } from '@/services/wallet.service';

const OnboardingPage: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading onboarding...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to start onboarding.</p>
        <a href="/wallets" className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition">Connect Wallet</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <OnboardingModal open={open} onClose={() => setOpen(false)} />
      {!open && (
        <button
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setOpen(true)}
        >
          Restart App Tour
        </button>
      )}
    </div>
  );
};

export default OnboardingPage;
