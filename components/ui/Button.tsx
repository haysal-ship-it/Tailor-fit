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
      'inline-flex items-center justify-center font-medium rounded-[24px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] select-none disabled:cursor-not-allowed disabled:opacity-30';

    const variantStyles = {
      // Primary button: --primary fill, white 14px/500 text, radius 24px
      primary:
        'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 active:bg-[var(--primary)]/95 border border-transparent text-[14px]',
      // Secondary/outline button: --chip fill, 1px --outline border, --text-2 text, 14px/500, radius 24px
      secondary:
        'bg-[var(--chip)] text-[var(--text-2)] hover:bg-[#e8e8e8] border border-[var(--outline)] text-[14px]',
      outline:
        'bg-[var(--chip)] text-[var(--text-2)] border border-[var(--outline)] hover:bg-[#e8e8e8] text-[14px]',
      ghost:
        'bg-transparent text-[var(--text-2)] hover:bg-[var(--chip)] border border-transparent text-[14px]',
      destructive:
        'bg-[var(--status-danger)] text-white hover:opacity-90 border border-transparent text-[14px]',
      link:
        'bg-transparent text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto border-0 text-[14px]',
    };

    const sizeStyles = {
      sm: 'py-2 px-3 text-[14px] gap-1',
      md: 'py-3 px-5 text-[14px] gap-1',
      lg: 'py-3.5 px-6 text-[14px] gap-1.5',
      icon: 'h-10 w-10 p-0',
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
