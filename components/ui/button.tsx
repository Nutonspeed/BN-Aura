import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium',
      outline: 'border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      ghost: 'text-white hover:bg-white/10'
    };
    
    const sizes = {
      default: 'px-6 py-3 text-sm',
      sm: 'px-4 py-2 text-xs',
      lg: 'px-8 py-4 text-base',
      icon: 'h-9 w-9 p-0'
    };
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';