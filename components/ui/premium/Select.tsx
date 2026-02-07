'use client';

import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  CaretDown
} from '@phosphor-icons/react';
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-2.5 bg-background border rounded-lg text-sm text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 appearance-none cursor-pointer",
              error ? "border-destructive focus:ring-destructive/50" : "border-border",
              icon && "pl-10",
              "pr-10",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <CaretDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "w-4 h-4 mt-0.5 rounded border-border text-primary",
            "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0",
            "cursor-pointer transition-all",
            className
          )}
          {...props}
        />
        <div>
          {label && (
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioGroupProps {
  name: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function RadioGroup({ name, options, value, onChange, label, orientation = 'vertical' }: RadioGroupProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className={cn(
        "flex gap-4",
        orientation === 'vertical' && "flex-col gap-2"
      )}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              disabled={option.disabled}
              className="w-4 h-4 border-border text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}