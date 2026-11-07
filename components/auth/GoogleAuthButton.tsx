'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface GoogleAuthButtonProps {
  label?: string;
  redirectTo?: string;
}

export function GoogleAuthButton({
  label = 'Continue with Google',
  redirectTo = '/?tab=overview',
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // Simulate brief OAuth redirection
    setTimeout(() => {
      router.push(redirectTo);
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-[44px] bg-[#EAEAEA] hover:bg-[#E0E0E0] active:bg-[#D5D5D5] border border-[#F8F8F8] rounded-[32px] flex items-center justify-center gap-2 px-4 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-wait"
    >
      <div className="relative size-[16px] shrink-0">
        <Image
          src="/assets/auth/google-icon.svg"
          alt="Google"
          width={16}
          height={16}
          unoptimized
          className="size-full"
        />
      </div>
      <span className="text-[14px] font-medium text-[#595959] whitespace-nowrap">
        {loading ? 'Connecting...' : label}
      </span>
    </button>
  );
}
