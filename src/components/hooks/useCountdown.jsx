import { useState, useEffect } from 'react';

/**
 * Custom hook for real-time countdown timer
 * Returns formatted time remaining
 */
export function useCountdown(targetDate) {
  const calculateTimeLeft = () => {
    if (!targetDate) return null;
    
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { expired: true, display: 'Expired' };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return {
      expired: false,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor(difference / 1000),
      display: days > 0 
        ? `${days}d ${hours}h ${minutes}m`
        : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!targetDate) return;

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Then update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Stop timer if expired
      if (newTimeLeft?.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}