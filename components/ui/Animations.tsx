'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Fade In animation
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 300, className }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Slide In animation
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 300,
  className 
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate-x-0 translate-y-0';
    switch (direction) {
      case 'left': return '-translate-x-8';
      case 'right': return 'translate-x-8';
      case 'up': return 'translate-y-8';
      case 'down': return '-translate-y-8';
    }
  };

  return (
    <div
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100' : 'opacity-0',
        getTransform(),
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Scale animation
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, duration = 300, className }: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger children animation
interface StaggerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function Stagger({ children, staggerDelay = 100, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Number counter animation
interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ 
  end, 
  start = 0, 
  duration = 1000, 
  prefix = '', 
  suffix = '',
  className 
}: CountUpProps) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);

  useEffect(() => {
    const startTime = Date.now();
    const range = end - start;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      
      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [start, end, duration]);

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Pulse animation
interface PulseProps {
  children: React.ReactNode;
  className?: string;
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {children}
    </div>
  );
}

// Shimmer loading effect
interface ShimmerProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Shimmer({ width = '100%', height = '20px', className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted rounded',
        className
      )}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }}
      />
    </div>
  );
}

// Skeleton loader
interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          height="16px" 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
}

// Bounce animation
interface BounceProps {
  children: React.ReactNode;
  className?: string;
}

export function Bounce({ children, className }: BounceProps) {
  return (
    <div className={cn('animate-bounce', className)}>
      {children}
    </div>
  );
}

// Spin animation
interface SpinProps {
  children: React.ReactNode;
  className?: string;
}

export function Spin({ children, className }: SpinProps) {
  return (
    <div className={cn('animate-spin', className)}>
      {children}
    </div>
  );
}

// Progress bar animation
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = '#8B5CF6',
  className,
  animated = true 
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth((value / max) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, max]);

  return (
    <div className={cn('h-2 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full',
          animated && 'transition-all duration-1000 ease-out'
        )}
        style={{ 
          width: `${width}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Typing animation
interface TypingProps {
  text: string;
  speed?: number;
  className?: string;
}

export function Typing({ text, speed = 50, className }: TypingProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  Stagger,
  CountUp,
  Pulse,
  Shimmer,
  Skeleton,
  Bounce,
  Spin,
  ProgressBar,
  Typing,
};
