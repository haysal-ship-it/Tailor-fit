'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { browserSupabase } from '@/lib/supabase/browser';
import { safeReturnTo } from '@/lib/auth/navigation';

interface GoogleAuthButtonProps {
  label?: string;
  redirectTo?: string;
}

export function GoogleAuthButton({
  label = 'Continue with Google',
  redirectTo = '/app?tab=overview',
}: GoogleAuthButtonProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await browserSupabase().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(safeReturnTo(redirectTo))}` } });
      if(error) throw error;
    } catch(error) { setError(error instanceof Error ? error.message : 'Google sign-in failed. Please retry.'); setLoading(false); }
  };

  return (
    <div><button
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
    </button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>
  );
}
