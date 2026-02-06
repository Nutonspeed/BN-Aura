'use client';

import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}: ResponsiveGridProps) {
  const colClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(`grid gap-${gap}`, colClasses, className)}>
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  mobileDirection?: 'row' | 'col';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export function ResponsiveStack({
  children,
  className,
  direction = 'row',
  mobileDirection = 'col',
  gap = 4,
  align = 'stretch',
  justify = 'start',
}: ResponsiveStackProps) {
  return (
    <div className={cn(
      'flex',
      mobileDirection === 'col' ? 'flex-col' : 'flex-row',
      direction === 'col' ? 'md:flex-col' : 'md:flex-row',
      `gap-${gap}`,
      align === 'start' && 'items-start',
      align === 'center' && 'items-center',
      align === 'end' && 'items-end',
      align === 'stretch' && 'items-stretch',
      justify === 'start' && 'justify-start',
      justify === 'center' && 'justify-center',
      justify === 'end' && 'justify-end',
      justify === 'between' && 'justify-between',
      justify === 'around' && 'justify-around',
      className
    )}>
      {children}
    </div>
  );
}

interface MobileOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOnly({ children, className }: MobileOnlyProps) {
  return (
    <div className={cn('md:hidden', className)}>
      {children}
    </div>
  );
}

interface DesktopOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function DesktopOnly({ children, className }: DesktopOnlyProps) {
  return (
    <div className={cn('hidden md:block', className)}>
      {children}
    </div>
  );
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}: SwipeableCardProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && (
        <div className="absolute inset-y-0 left-0 w-20 bg-green-500 flex items-center justify-center">
          {leftAction}
        </div>
      )}
      
      {/* Right action background */}
      {rightAction && (
        <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
          {rightAction}
        </div>
      )}
      
      {/* Main content */}
      <div className="relative bg-background">
        {children}
      </div>
    </div>
  );
}

export default {
  ResponsiveGrid,
  ResponsiveStack,
  MobileOnly,
  DesktopOnly,
  SwipeableCard,
};
