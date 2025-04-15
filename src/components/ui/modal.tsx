import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, size = 'md', children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`relative w-full ${sizeMap[size]} bg-background rounded-lg shadow-xl animate-fade-in`}>
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

export const ModalContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">{children}</div>
);
export const ModalHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);
export const ModalTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-2xl font-bold mb-2 ${className}`}>{children}</h2>
);
export const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);
export const ModalFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>
);
