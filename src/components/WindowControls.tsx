import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Square, X } from 'lucide-react';

declare global {
  interface Window {
    electron: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
    };
  }
}

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if we're running in Electron
    if (typeof window.electron !== 'undefined') {
      // Check initial maximize state
      window.electron.isMaximized().then(setIsMaximized).catch(err => {
        console.error('Failed to get maximize state:', err);
      });

      // Listen for maximize state changes
      const unsubscribe = window.electron.onMaximizeChange((maximized) => {
        setIsMaximized(maximized);
      });

      // Clean up listener when component unmounts
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, []);

  const handleMinimize = () => {
    if (typeof window.electron !== 'undefined') {
      window.electron.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window.electron !== 'undefined') {
      window.electron.maximize();
    }
  };

  const handleClose = () => {
    if (typeof window.electron !== 'undefined') {
      window.electron.close();
    }
  };

  // Don't render window controls if not in Electron
  if (typeof window.electron === 'undefined') {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 -mr-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-800"
        onClick={handleMinimize}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-800"
        onClick={handleMaximize}
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-red-500 hover:text-white"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}