'use client';

import React, { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isPassword?: boolean;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ isPassword = false, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={inputType}
          className={`w-full h-[44px] bg-[#F8F8F8] border border-[#CCCCCC] focus:border-[#CCCCCC] focus:outline-none focus:ring-0 rounded-[32px] px-4 text-[13px] text-neutral-900 placeholder:text-[#595959] transition-colors ${
            isPassword ? 'pr-11' : ''
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center text-[#595959] hover:text-black transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <Eye size={18} weight="regular" />
            ) : (
              <EyeSlash size={18} weight="regular" />
            )}
          </button>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
