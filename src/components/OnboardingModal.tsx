import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Gift, HelpCircle, Star, User, Zap } from 'lucide-react';

const onboardingSteps = [
  {
    icon: <HelpCircle className="w-8 h-8 text-primary" />, 
    title: 'Welcome to Avilasha',
    description: 'Your all-in-one crypto portfolio manager. Track assets, complete quests, and earn rewards!'
  },
  {
    icon: <Gift className="w-8 h-8 text-yellow-500" />,
    title: 'Quests & Airdrop',
    description: 'Complete quests to earn points. Points make you eligible for exclusive airdrops and rewards.'
  },
  {
    icon: <User className="w-8 h-8 text-blue-500" />,
    title: 'Profile & Security',
    description: 'Manage your profile, enable advanced security, and personalize your experience.'
  },
  {
    icon: <Star className="w-8 h-8 text-green-500" />,
    title: 'Advanced Analytics',
    description: 'Monitor your assets, DeFi, NFTs, and market trends with beautiful analytics.'
  },
  {
    icon: <Zap className="w-8 h-8 text-purple-500" />,
    title: 'Get Started!',
    description: 'Explore, connect your wallet, and start your crypto journey!'
  },
];

const OnboardingModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const isLast = step === onboardingSteps.length - 1;
  const isFirst = step === 0;

  useEffect(() => {
    if (!open) return;
    if (localStorage.getItem('onboardingComplete')) {
      onClose();
    }
  }, [open, onClose]);

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('onboardingComplete', 'true');
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep(step - 1);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalContent className="rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-primary/10">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-3 text-2xl font-bold text-primary drop-shadow-glow">
            {onboardingSteps[step].icon}
            {onboardingSteps[step].title}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="w-full bg-muted-foreground/10 rounded h-2 mb-4">
            <div
              className="bg-primary h-2 rounded transition-all duration-300"
              style={{ width: `${((step + 1) / onboardingSteps.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-lg text-muted-foreground mb-4 text-center font-medium animate-fade-in-slow">{onboardingSteps[step].description}</p>
        </ModalBody>
        <ModalFooter className="flex justify-between items-center mt-2">
          <Button variant="ghost" onClick={onClose} className="transition hover:bg-primary/10">Skip</Button>
          <div className="flex gap-2">
            {onboardingSteps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full border ${i === step ? 'bg-primary border-primary' : 'bg-muted-foreground/20 border-gray-300'} transition-all`}></span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isFirst} className="transition">Back</Button>
            <Button onClick={handleNext} className="bg-primary text-white rounded transition hover:bg-primary/90">{isLast ? 'Finish' : 'Next'}</Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OnboardingModal;
