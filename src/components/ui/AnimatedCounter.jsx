import React from 'react';
import { useAnimatedValue } from '../hooks/useAnimatedValue';

/**
 * Animated counter component
 * Smoothly transitions between number values
 */
export default function AnimatedCounter({
  value,
  duration = 1000,
  formatter = (v) => Math.round(v).toLocaleString(),
  prefix = '',
  suffix = '',
  className = ''
}) {
  const { value: animatedValue, isAnimating } = useAnimatedValue(value, duration);

  return (
    <span className={`${className} ${isAnimating ? 'text-blue-600' : ''} transition-colors duration-300`}>
      {prefix}{formatter(animatedValue)}{suffix}
    </span>
  );
}