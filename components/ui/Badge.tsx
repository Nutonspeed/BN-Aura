'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, HTMLAttributes } from 'react';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
        ghost: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary font-bold",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, pulse, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full mr-1.5",
              {
                'default': "bg-primary",
                'secondary': "bg-secondary-foreground",
                'success': "bg-success",
                'warning': "bg-warning",
                'destructive': "bg-destructive",
                'outline': "bg-foreground",
                'ghost': "bg-muted-foreground",
                'primary': "bg-primary",
              }[variant || 'default'],
              pulse && "animate-pulse"
            )}
          />
        )}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };