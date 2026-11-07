'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { FeaturesSection } from './FeaturesSection';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Who is TailorFit for?',
    answer:
      'TailorFit is designed for tailors, dressmakers and studio assistants who manage client measurements and garment orders.',
  },
  {
    question: 'Does the mannequin take measurements automatically?',
    answer:
      "No. You take measurements with your tape measure as usual, then record them on the mannequin's measurement points or in the List view to keep them organized.",
  },
  {
    question: "Can I reuse a client's measurements?",
    answer:
      'Yes. When a client returns for a new garment, you can open their record in Clients and reuse any saved fitting as the starting baseline for the new order.',
  },
  {
    question: 'Where are my records stored?',
    answer:
      'All client details, measurements, reference photos, and orders are stored securely directly in your browser workspace with resilient offline availability.',
  },
  {
    question: 'Can I back up my work?',
    answer:
      'Yes. In Studio Settings, you can create a full JSON backup of your studio records and restore it anytime to prevent data loss or move between devices.',
  },
];

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#1D1D1D] font-sans selection:bg-[#1D49E8]/15 selection:text-[#1D49E8] antialiased overflow-x-clip">
      {/* 1. Header & Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-md shadow-xs py-4 border-b border-black/5'
            : 'bg-transparent py-6 sm:py-8'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-3 group" aria-label="TailorFit home">
            <div className="relative h-[32px] w-[140px] sm:w-[150px]">
              <Image
                src={scrolled ? '/assets/landing/logo-black.png' : '/assets/landing/logo-white.png'}
                alt="TailorFit Logo"
                fill
                priority
                unoptimized
                className="object-contain object-left transition-opacity duration-200"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className={`text-[17px] font-medium transition-colors hover:opacity-100 ${
                scrolled ? 'text-[#1D1D1D]/80 hover:text-black' : 'text-white/90 hover:text-white'
              }`}
            >
              How it works
            </a>
            <a
              href="#features"
              className={`text-[17px] font-medium transition-colors hover:opacity-100 ${
                scrolled ? 'text-[#1D1D1D]/80 hover:text-black' : 'text-white/90 hover:text-white'
              }`}
            >
              Features
            </a>
            <a
              href="#faq"
              className={`text-[17px] font-medium transition-colors hover:opacity-100 ${
                scrolled ? 'text-[#1D1D1D]/80 hover:text-black' : 'text-white/90 hover:text-white'
              }`}
            >
              FAQ
            </a>
          </nav>

          {/* Desktop Auth / App CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/signin"
              className={`px-5 py-2.5 text-[17px] font-medium rounded-full transition-colors ${
                scrolled
                  ? 'text-[#1D1D1D] hover:bg-neutral-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Log in
            </Link>
            <Link
              href="/?tab=overview"
              className="bg-black text-white hover:bg-neutral-900 px-6 py-3 rounded-full text-[16px] font-medium transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Tailorfit
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-full transition-colors ${
              scrolled ? 'text-black hover:bg-neutral-100' : 'text-white hover:bg-white/10'
            }`}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-neutral-200 px-6 py-6 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-medium text-neutral-800 py-2 border-b border-neutral-100"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-medium text-neutral-800 py-2 border-b border-neutral-100"
            >
              Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-medium text-neutral-800 py-2 border-b border-neutral-100"
            >
              FAQ
            </a>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border border-neutral-300 text-neutral-800 rounded-full text-[16px] font-medium"
              >
                Log in
              </Link>
              <Link
                href="/?tab=overview"
                className="w-full text-center py-3 bg-black text-white rounded-full text-[16px] font-medium shadow-md"
              >
                Open Tailorfit
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative w-full h-[760px] sm:h-[840px] lg:h-[1024px] overflow-hidden bg-[#5B9DF5]">
        {/* Sky Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/assets/landing/hero-sky.png"
            alt="Soft blue sky with clouds"
            fill
            priority
            unoptimized
            className="object-cover object-top opacity-95"
          />
        </div>

        {/* Hero Copy & CTA */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 pt-28 sm:pt-36 lg:pt-[175px] flex flex-col items-center text-center">
          <div className="max-w-[840px] flex flex-col items-center gap-4 text-white">
            <h1 className="text-[38px] sm:text-[54px] lg:text-[64px] font-bold leading-[1.12] tracking-tight">
              <span>Made to measure. </span>
              <span className="font-serif italic font-normal text-white drop-shadow-sm">
                Built to keep you organized.
              </span>
            </h1>

            <p className="text-[17px] sm:text-[20px] font-medium text-white/95 max-w-[580px] leading-[1.4] mt-2 drop-shadow-xs">
              Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.
            </p>

            {/* Hero CTA Button */}
            <div className="mt-4 sm:mt-6">
              <Link
                href="/?tab=overview"
                className="inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white px-8 py-4 rounded-full text-[18px] font-semibold transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                Open Tailorfit
              </Link>
            </div>
          </div>
        </div>

        {/* Hero App Preview Mockup Card - Anchored at top: 579px (desktop) so lower part is clipped at 1024px */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[500px] sm:top-[520px] lg:top-[579px] w-[92vw] max-w-[1040px] z-20 pointer-events-none">
          <div className="p-2 sm:p-2.5 rounded-[22px] sm:rounded-[28px] bg-[#D0E4FF]/80 backdrop-blur-md border border-white/90 shadow-2xl transition-transform hover:scale-[1.005] duration-300 pointer-events-auto">
            <div className="relative w-full aspect-[3166/1979] rounded-[16px] sm:rounded-[22px] overflow-hidden bg-white shadow-md">
              <Image
                src="/assets/landing/hero-app-preview.png"
                alt="TailorFit Studio Workspace with 3D Mannequin and Client Intake"
                fill
                priority
                unoptimized
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-[480px]">
            <h2 className="text-[32px] sm:text-[38px] font-semibold text-[#1D1D1D] leading-[1.2]">
              From client details to the next fitting.
            </h2>
          </div>
          <div className="max-w-[480px]">
            <p className="text-[18px] sm:text-[19px] font-medium text-[#727272] leading-[1.44]">
              Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.
            </p>
          </div>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 01 - Add your client */}
          <div className="flex flex-col gap-6 group">
            <div className="relative h-[400px] w-full rounded-[32px] overflow-hidden bg-[#E4CECE] flex items-center justify-center p-6">
              {/* Noisy Gradient Backgrounds */}
              <div className="absolute inset-0 pointer-events-none opacity-85">
                <Image
                  src="/assets/landing/noisy-gradient-1.png"
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 pointer-events-none opacity-90 mix-blend-overlay">
                <Image
                  src="/assets/landing/noisy-gradient-2.png"
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Floating Miniature "Basic Information" Form Card */}
              <div className="relative w-full max-w-[320px] bg-white rounded-[16px] p-5 shadow-xl border border-neutral-100 flex flex-col gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <span className="text-[16px] font-semibold text-black">Basic Information</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-neutral-600">Client</span>
                    <div className="px-3 py-2 bg-[#F8F8F8] rounded-[8px] text-[13px] text-neutral-500 border border-neutral-200/50">
                      e.g Adriana Kunle
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-neutral-600">Garment Type</span>
                    <div className="px-3 py-2 bg-[#F8F8F8] rounded-[8px] text-[13px] text-neutral-500 border border-neutral-200/50">
                      Bespoke African Gown
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-neutral-600">Phone</span>
                      <div className="px-2.5 py-2 bg-[#F8F8F8] rounded-[8px] text-[12px] text-neutral-500 border border-neutral-200/50 truncate">
                        +234 -
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-neutral-600">Email</span>
                      <div className="px-2.5 py-2 bg-[#F8F8F8] rounded-[8px] text-[12px] text-neutral-500 border border-neutral-200/50 truncate">
                        name@example.com
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[24px] font-semibold text-black">Add your client</h3>
              <p className="text-[18px] text-[#727272] leading-[1.44]">
                Enter their contact details and the garment you&apos;re making.
              </p>
            </div>
          </div>

          {/* Card 02 - Record the fitting */}
          <div className="flex flex-col gap-6 group">
            <div className="relative h-[400px] w-full rounded-[32px] overflow-hidden bg-[#E4CECE] flex items-center justify-center p-6">
              {/* Noisy Gradient Background */}
              <div className="absolute inset-0 pointer-events-none opacity-90">
                <Image
                  src="/assets/landing/noisy-gradient-2.png"
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Floating Miniature "Garment Templates" Card */}
              <div className="relative w-full max-w-[320px] bg-white rounded-[16px] p-5 shadow-xl border border-neutral-100 flex flex-col gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <span className="text-[14px] font-semibold text-black">Garment Templates</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-[#F8F9FF] border border-[#287CF1] rounded-[8px] flex flex-col gap-0.5">
                    <span className="text-[12px] font-semibold text-[#1D49E8]">Shirt / Blouse</span>
                    <span className="text-[10px] text-neutral-600">Essential measurements for bespoke dress shirts</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-[8px] flex flex-col gap-0.5 opacity-90">
                    <span className="text-[12px] font-medium text-neutral-800">Trousers / Shorts</span>
                    <span className="text-[10px] text-neutral-500">Fittings for tailored or pleated pants</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-[8px] flex flex-col gap-0.5 opacity-90">
                    <span className="text-[12px] font-medium text-neutral-800">Gown / Dress</span>
                    <span className="text-[10px] text-neutral-500">Evening wear, party gowns, bridal</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
                  <div className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-[11px] font-medium">
                    Cancel
                  </div>
                  <div className="px-3 py-1 bg-[#1D49E8] text-white rounded-full text-[11px] font-medium">
                    Choose Template
                  </div>
                </div>
              </div>
            </div>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[24px] font-semibold text-black">Record the fitting.</h3>
              <p className="text-[18px] text-[#727272] leading-[1.44]">
                Choose a garment template, then enter measurements on the mannequin or in List view.
              </p>
            </div>
          </div>

          {/* Card 03 - Keep the order together */}
          <div className="flex flex-col gap-6 group">
            <div className="relative h-[400px] w-full rounded-[32px] overflow-hidden bg-[#E4CECE] flex items-center justify-center p-6">
              {/* Noisy Gradient Background */}
              <div className="absolute inset-0 pointer-events-none opacity-90">
                <Image
                  src="/assets/landing/noisy-gradient-1.png"
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Floating Miniature "Style References & Price" Card */}
              <div className="relative w-full max-w-[320px] flex flex-col gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                {/* Upload card */}
                <div className="bg-white rounded-[16px] p-4 shadow-xl border border-neutral-100 flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-black">Style References</span>
                  <div className="h-[80px] rounded-[10px] border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-1.5 bg-neutral-50/50">
                    <div className="w-8 h-8 rounded-full bg-neutral-200/80 flex items-center justify-center text-neutral-700">
                      <Image
                        src="/assets/landing/cloud-arrow-up.svg"
                        alt=""
                        width={16}
                        height={16}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600">Tap to upload image</span>
                  </div>
                </div>

                {/* Price & Due Date Card */}
                <div className="bg-white rounded-[16px] p-4 shadow-xl border border-neutral-100 flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-black">Price / Due date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-600">Price (₦)</span>
                      <div className="px-3 py-1.5 bg-[#F8F8F8] rounded-[8px] text-[12px] font-medium text-neutral-800 border border-neutral-200/60">
                        ₦85,000
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-600">Due Date</span>
                      <div className="px-3 py-1.5 bg-[#F8F8F8] rounded-[8px] text-[12px] font-medium text-neutral-800 border border-neutral-200/60">
                        09/10/2026
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[24px] font-semibold text-black">Keep the order together.</h3>
              <p className="text-[18px] text-[#727272] leading-[1.44]">
                Add style references, price and a due date. Return to the client&apos;s record when you need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Deep-Dive Section */}
      <FeaturesSection />

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-20 sm:py-28 max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 scroll-mt-24">
        <div className="max-w-[840px] mx-auto flex flex-col items-center text-center mb-14">
          <h2 className="text-[34px] sm:text-[40px] font-semibold text-[#1D1D1D] leading-[1.2]">
            Frequently asked questions
          </h2>
          <p className="text-[18px] sm:text-[20px] text-[#727272] font-medium leading-[1.44] mt-3 max-w-[540px]">
            Get familiar with how TailorFit handles measurements, client records and your saved work.
          </p>
        </div>

        {/* Accordions */}
        <div className="max-w-[800px] mx-auto flex flex-col gap-4">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={faq.question}
                className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-7 shadow-xs transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-[18px] sm:text-[20px] font-medium text-[#1D1D1D] leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-[#1D49E8] text-white rotate-180' : 'bg-[#1D49E8] text-white hover:opacity-90'
                    }`}
                  >
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 animate-in fade-in-50 duration-200">
                    <p className="text-[16px] sm:text-[18px] text-[#727272] leading-[1.5]">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Closing Call-To-Action Banner */}
      <section id="cta-banner" className="relative w-full overflow-hidden py-20 sm:py-28 lg:py-32">
        {/* Full-bleed Atmospheric background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/assets/landing/cta-banner-bg.png"
            alt=""
            fill
            unoptimized
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000CAE]/80 via-[#1D49E8]/65 to-[#4F46E5]/75 backdrop-blur-[1px]" />
        </div>

        {/* Centered Content */}
        <div className="relative max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Text */}
          <div className="flex flex-col gap-3 text-white max-w-[620px] text-center lg:text-left">
            <h2 className="text-[34px] sm:text-[46px] lg:text-[48px] font-bold leading-[1.2] tracking-tight">
              Give every fitting a place to come back to.
            </h2>
            <p className="text-[18px] sm:text-[20px] text-white/95 font-medium leading-[1.35]">
              Bring your client details, measurements and next garment order together in TailorFit.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-full text-white hover:bg-white/10 text-[17px] font-medium transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/?tab=overview"
              className="bg-black hover:bg-neutral-900 text-white px-8 py-4 rounded-full text-[17px] font-semibold transition-all shadow-xl hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <span>Open Tailorfit</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="relative w-full overflow-hidden bg-white min-h-[750px] lg:min-h-[900px] flex flex-col justify-between pt-20 sm:pt-28 pb-10">
        {/* Full-bleed Toile Atelier Background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/assets/landing/footer-toile.png"
            alt="Architectural Tailoring Atelier Illustration"
            fill
            unoptimized
            className="object-cover object-bottom"
          />
        </div>

        {/* Top Branding & Navigation Links */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            {/* Left Branding */}
            <div className="flex flex-col gap-4 max-w-[380px]">
              <div className="relative h-[36px] w-[160px]">
                <Image
                  src="/assets/landing/logo-black.png"
                  alt="TailorFit"
                  fill
                  unoptimized
                  className="object-contain object-left"
                />
              </div>
              <p className="text-[20px] sm:text-[22px] font-normal text-[#3A6FDA] leading-[1.3]">
                A workspace for client measurements and garment orders.
              </p>
            </div>

            {/* Right Links Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-[#3A6FDA]">
              <div className="flex flex-col gap-3">
                <span className="text-[18px] font-semibold text-[#1D1D1D]">Navigation</span>
                <a href="#how-it-works" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  How it works
                </a>
                <a href="#features" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  Features
                </a>
                <a href="#faq" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  FAQ
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[18px] font-semibold text-[#1D1D1D]">Workspace</span>
                <Link href="/?tab=overview" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  Overview
                </Link>
                <Link href="/?tab=clients" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  Clients
                </Link>
                <Link href="/?tab=settings" className="text-[16px] hover:text-[#1D49E8] transition-colors">
                  Settings
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[18px] font-semibold text-[#1D1D1D]">Atelier</span>
                <span className="text-[15px] text-[#727272]">Local-First Storage</span>
                <span className="text-[15px] text-[#727272]">Zero Data Leakage</span>
                <span className="text-[15px] text-[#727272]">JSON Backups</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 text-[14px] text-neutral-500 text-center">
          &copy; {new Date().getFullYear()} TailorFit Atelier. Designed for bespoke tailors and dressmakers.
        </div>
      </footer>
    </div>
  );
}