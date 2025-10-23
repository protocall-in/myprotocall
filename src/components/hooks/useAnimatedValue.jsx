import { useState, useEffect } from 'react';

/**
 * Hook for animating number changes
 * Provides smooth transitions when values update
 */
export function useAnimatedValue(targetValue, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetValue === displayValue) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const difference = targetValue - startValue;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (difference * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return { value: displayValue, isAnimating };
}