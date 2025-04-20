import React, { useCallback, useEffect, useState } from 'react';

const POINTS_KEY = 'daily_mined_points';
const LAST_MINED_KEY = 'last_mined_timestamp';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const confettiColors = [
  '#FFD700', '#FF8C00', '#FF69B4', '#00BFFF', '#7CFC00', '#FF4500', '#40E0D0', '#9B30FF'
];

const getRandomColor = () => confettiColors[Math.floor(Math.random() * confettiColors.length)];

/**
 * DailyPointsMiner
 * Allows user to mine points once every 24 hours.
 * Points and cooldown are persisted in localStorage.
 */
const DailyPointsMiner: React.FC = () => {
  const [points, setPoints] = useState<number>(0);
  const [lastMined, setLastMined] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedPoints = parseInt(localStorage.getItem(POINTS_KEY) || '0', 10);
    const storedLastMined = parseInt(localStorage.getItem(LAST_MINED_KEY) || '0', 10) || null;
    setPoints(storedPoints);
    setLastMined(storedLastMined);
  }, []);

  // Cooldown calculation
  useEffect(() => {
    if (!lastMined) return;
    const now = Date.now();
    const nextAvailable = lastMined + COOLDOWN_MS;
    if (now < nextAvailable) {
      setCooldown(nextAvailable - now);
      if (timer) clearInterval(timer);
      const t = setInterval(() => {
        const remaining = nextAvailable - Date.now();
        setCooldown(remaining > 0 ? remaining : 0);
        if (remaining <= 0 && timer) clearInterval(timer);
      }, 1000);
      setTimer(t);
      return () => clearInterval(t);
    } else {
      setCooldown(0);
    }
    // eslint-disable-next-line
  }, [lastMined]);

  // Format ms to HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Mining handler
  const handleMine = useCallback(() => {
    if (cooldown > 0) return;
    const newPoints = points + 1;
    const now = Date.now();
    setPoints(newPoints);
    setLastMined(now);
    localStorage.setItem(POINTS_KEY, newPoints.toString());
    localStorage.setItem(LAST_MINED_KEY, now.toString());
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
  }, [cooldown, points]);

  // Confetti SVG generator
  const Confetti = () => (
    <svg className="pointer-events-none absolute left-0 top-0 w-full h-full z-10 animate-fade-in" style={{pointerEvents:'none'}}>
      {[...Array(40)].map((_, i) => (
        <circle
          key={i}
          cx={Math.random() * 100 + '%'}
          cy={Math.random() * 100 + '%'}
          r={Math.random() * 6 + 2}
          fill={getRandomColor()}
          opacity={0.7}
        />
      ))}
    </svg>
  );

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-tr from-yellow-100 via-yellow-50 to-yellow-300 shadow-lg p-6 mb-6 flex flex-col items-center gap-2">
      {showConfetti && <Confetti />}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">⛏️</span>
        <h2 className="text-xl font-extrabold bg-gradient-to-r from-yellow-500 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow">Mine Daily Points</h2>
      </div>
      <div className="mb-2 text-lg font-semibold text-yellow-700 flex items-center gap-2">
        <span className="inline-block animate-bounce">⭐</span>
        Current Points: <span className="font-extrabold text-yellow-900 text-2xl drop-shadow">{points}</span>
      </div>
      <button
        className={`relative px-8 py-3 mt-2 rounded-full text-lg font-bold shadow-xl transition bg-gradient-to-r from-yellow-400 via-orange-300 to-pink-300 hover:scale-105 hover:from-yellow-500 hover:to-pink-400 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={handleMine}
        disabled={cooldown > 0}
        aria-disabled={cooldown > 0}
        aria-label={cooldown > 0 ? `Mine available in ${formatTime(cooldown)}` : 'Mine points now'}
      >
        {cooldown > 0 ? `Mine in ${formatTime(cooldown)}` : '🚀 Mine Points'}
      </button>
      <div className="text-xs text-gray-600 mt-2">You can mine once every 24 hours. Keep your streak!</div>
    </div>
  );
};

export default DailyPointsMiner;
