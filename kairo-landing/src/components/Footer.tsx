import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white tracking-tight mb-1">
              <Image src="/logo.svg" alt="Kairo" width={28} height={28} className="w-7 h-7 rounded-md" />
              Kairo
            </div>
            <p className="text-xs text-neutral-600">The API client that respects your time.</p>
            <p className="text-xs text-neutral-700 mt-1">v0.4.0</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Features</a>
            <a href="#scripts" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Scripts</a>
            <a href="#runner" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Runner</a>
            <a href="#protocols" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Protocols</a>
            <a href="#download" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Download</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-xs text-neutral-700">© {new Date().getFullYear()} Kairo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
