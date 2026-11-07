'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AuthDivider } from '@/components/auth/AuthDivider';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    // Simulate login and redirect to workspace
    setTimeout(() => {
      router.push('/?tab=overview');
    }, 400);
  };

  return (
    <AuthLayout title="Sign in to Tailorfit">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Google Social Auth */}
        <GoogleAuthButton label="Continue with Google" />

        {/* OR Divider */}
        <AuthDivider />

        {/* Inputs */}
        <div className="flex flex-col gap-3 w-full">
          <AuthInput
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <AuthInput
            isPassword
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-[13px] text-red-600 font-medium text-center">
            {errorMessage}
          </p>
        )}

        {/* Reset Password & Submit */}
        <div className="flex flex-col gap-3 mt-2 w-full">
          <Link
            href="/reset-password"
            className="text-[14px] font-medium text-black hover:text-[#1D49E8] transition-colors self-start"
          >
            Reset Password
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[44px] bg-[#1D49E8] hover:bg-[#153bbd] active:scale-[0.99] text-white rounded-[32px] text-[14px] font-medium flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {submitting ? 'Signing in...' : 'Continue'}
          </button>
        </div>

        {/* Switcher: Don't have an account? Sign up */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[14px]">
          <span className="text-[#595959] font-medium">Don’t have an account?</span>
          <Link
            href="/signup"
            className="font-semibold text-black hover:text-[#1D49E8] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
