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
      onMaximizeChange: (callback: (event: any, isMaximized: boolean) => void) => void;
    };
  }
}

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximize state
    window.electron.isMaximized().then(setIsMaximized);

    // Listen for maximize state changes
    window.electron.onMaximizeChange((_event, maximized) => {
      setIsMaximized(maximized);
    });
  }, []);

  const handleMinimize = () => {
    window.electron.minimize();
  };

  const handleMaximize = () => {
    window.electron.maximize();
  };

  const handleClose = () => {
    window.electron.close();
  };

  return (
    <div className="flex items-center space-x-1">
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