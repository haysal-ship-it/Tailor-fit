'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion-tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] select-none disabled:cursor-not-allowed disabled:opacity-30';

    const variantStyles = {
      // Primary is inverted monochrome: --text background with --bg text
      primary:
        'bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:opacity-95 shadow-xs border border-transparent',
      secondary:
        'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]',
      outline:
        'bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
      ghost:
        'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] border border-transparent',
      destructive:
        'bg-[var(--status-danger)] text-white hover:opacity-90 border border-transparent',
      link:
        'bg-transparent text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto border-0',
    };

    const sizeStyles = {
      sm: 'h-8 px-3.5 text-xs gap-1.5',
      md: 'h-10 min-h-[40px] px-5 text-sm gap-2 max-sm:min-h-[44px]',
      lg: 'h-12 min-h-[44px] px-6 text-base gap-2.5',
      icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0 max-sm:min-h-[44px] max-sm:min-w-[44px]',
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={disabled || isLoading || shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={springSnappy}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...(props as any)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
