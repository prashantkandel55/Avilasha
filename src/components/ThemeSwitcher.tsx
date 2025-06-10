import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor, Zap, Cpu, Crown, Gem } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          {theme === 'light' ? (
            <Sun className="h-5 w-5 transition-all" />
          ) : theme === 'dark' ? (
            <Moon className="h-5 w-5 transition-all" />
          ) : theme === 'cyberpunk' ? (
            <Zap className="h-5 w-5 transition-all text-accent" />
          ) : theme === 'neon' ? (
            <Cpu className="h-5 w-5 transition-all text-primary" />
          ) : theme === 'luxury' ? (
            <Crown className="h-5 w-5 transition-all text-primary" />
          ) : theme === 'royal' ? (
            <Gem className="h-5 w-5 transition-all text-primary" />
          ) : (
            <Monitor className="h-5 w-5 transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in fade-in-80 slide-in-from-top-2 w-40 p-2">
        <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md">
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('luxury')} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md">
          <Crown className="h-4 w-4 text-green-500" />
          <span className="text-green-500 font-medium">Luxury</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('royal')} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md">
          <Gem className="h-4 w-4 text-green-500" />
          <span className="text-green-500 font-medium">Royal</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent/20 rounded-md">
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;