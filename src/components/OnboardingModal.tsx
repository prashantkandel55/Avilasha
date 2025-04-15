import React, { useState } from 'react';
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

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-3">
            {onboardingSteps[step].icon}
            {onboardingSteps[step].title}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-lg text-muted-foreground mb-4">{onboardingSteps[step].description}</p>
        </ModalBody>
        <ModalFooter className="flex justify-between items-center">
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <div className="flex gap-2">
            {onboardingSteps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-muted-foreground/20'}`}></span>
            ))}
          </div>
          <Button onClick={() => isLast ? onClose() : setStep(step + 1)}>
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OnboardingModal;
