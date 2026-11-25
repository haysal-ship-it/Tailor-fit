import Link from 'next/link';

export default function AccountDeletedPage() {
  return <main className="mx-auto max-w-lg px-6 py-20">
    <h1 className="text-2xl font-semibold">Your TailorFit account has been deleted.</h1>
    <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-[var(--primary)] underline">Return to TailorFit</Link>
  </main>;
}
