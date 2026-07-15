import Image from "next/image";
import Link from "next/link";

export default function BlogHeader() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight">
          <Image src="/logo.svg" alt="Kairo" width={28} height={28} className="w-7 h-7 rounded-md" />
          Kairo
        </Link>
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </nav>
  );
}
