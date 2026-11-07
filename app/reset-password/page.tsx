'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 500);
  };

  return (
    <AuthLayout title="Reset password">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center py-4 bg-blue-50/70 border border-blue-200/60 rounded-[20px] p-5">
            <div className="w-10 h-10 rounded-full bg-[#1D49E8]/10 text-[#1D49E8] flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-semibold text-black">Reset link sent!</p>
              <p className="text-[13px] text-[#595959] max-w-[320px]">
                We sent password reset instructions to{' '}
                <span className="font-medium text-black">{email}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-[13px] text-[#1D49E8] hover:underline font-medium mt-1 cursor-pointer"
            >
              Didn’t receive the email? Try again
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 w-full">
              <AuthInput
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[44px] bg-[#1D49E8] hover:bg-[#153bbd] active:scale-[0.99] text-white rounded-[32px] text-[14px] font-medium flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {submitting ? 'Sending link...' : 'Send reset link'}
              </button>
            </div>
          </>
        )}

        {/* Back Link */}
        <div className="flex items-center justify-center pt-2">
          <Link
            href="/signin"
            className="text-[14px] font-semibold text-black hover:text-[#1D49E8] transition-colors"
          >
            Go back to Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
