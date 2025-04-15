import React, { useState } from 'react';
import OnboardingModal from '@/components/OnboardingModal';

const OnboardingPage: React.FC = () => {
  const [open, setOpen] = useState(true);
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
