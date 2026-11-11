'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-lg lg:max-w-[1360px] min-h-[600px] lg:h-[800px] flex flex-col lg:flex-row gap-3 lg:gap-[8px] items-stretch justify-center">
        {/* Left: Auth Form Card */}
        <div className="w-full lg:flex-1 bg-[#F8F8F8] border-2 border-white rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-sm flex flex-col justify-between items-center relative min-h-[560px] lg:h-full">
          {/* Main Content Area */}
          <div className="w-full max-w-[450px] flex flex-col items-center gap-8 my-auto">
            {/* Header: Logo & Title */}
            <div className="flex flex-col items-center gap-4 text-center">
              <Link href="/" className="group cursor-pointer" aria-label="TailorFit Home">
                <div className="h-[38.5px] w-[55px] relative overflow-hidden transition-transform group-hover:scale-105">
                  <Image
                    src="/assets/auth/logo-icon.png"
                    alt="TailorFit"
                    width={172}
                    height={39}
                    priority
                    unoptimized
                    className="absolute h-full max-w-none top-0 left-0 object-contain object-left"
                  />
                </div>
              </Link>

              <h1 className="text-[24px] font-bold text-black tracking-tight leading-normal">
                {title}
              </h1>
            </div>

            {/* Inner Form / Actions */}
            <div className="w-full flex flex-col items-stretch">
              {children}
            </div>
          </div>

          {/* Legal Links Footer */}
          <div className="flex items-center gap-4 pt-6 mt-4 text-[#595959] text-[14px]">
            <Link
              href="/terms"
              className="border-b border-[#595959] pb-[1px] hover:text-black transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="border-b border-[#595959] pb-[1px] hover:text-black transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Right: Cosmic Artwork Card (Visible on Desktop only) */}
        <div className="hidden lg:block lg:flex-1 relative rounded-[32px] overflow-hidden lg:h-full shadow-sm bg-neutral-900">
          <Image
            src="/assets/auth/auth-artwork.png"
            alt="Cosmic Atelier Nebula Artwork"
            fill
            priority
            unoptimized
            className="object-cover size-full rounded-[32px] pointer-events-none select-none"
          />
        </div>
      </div>
    </div>
  );
}
