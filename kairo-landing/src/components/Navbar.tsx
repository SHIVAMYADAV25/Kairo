import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#scripts", label: "Scripts" },
  { href: "#runner", label: "Runner" },
  { href: "#api-testing", label: "API Testing" },
  { href: "#protocols", label: "Protocols" },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-white tracking-tight shrink-0"
        >
          <Image src="/logo.svg" alt="Kairo" width={28} height={28} className="w-7 h-7 rounded-md" />
          Kairo
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
            Alpha
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="ml-auto hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Create Your Own Kairo Redirect Link */}
          <Link
            href="/about"
            className="text-sm text-neutral-400 hover:text-orange-400 transition-colors border-r border-white/10 pr-6 mr-2"
          >
            Create your own Kairo
          </Link>
          
          <a
            href="#get-kairo"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
          >
            Download
          </a>

          {/* Desktop Image Link Block */}
          <a
            href="#about-me"
            className="group block relative w-9 h-9 rounded-3xl overflow-hidden border border-white/10 hover:border-orange-500/80 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 active:scale-95 shrink-0 aspect-square"
            title="Know about me and this project"
          >
            <Image 
              src="/bio.png" 
              alt="Know Me" 
              fill
              sizes="36px"
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          </a>
        </div>

        {/* Mobile Layout Menu Trigger Container */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Quick Mobile Access link to About */}
          <Link
            href="/about"
            className="text-xs bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md text-neutral-300 active:scale-95 text-[11px]"
          >
            Build Kairo
          </Link>

          <a
            href="#about-me"
            className="block relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0 aspect-square"
          >
            <Image 
              src="/bio.png" 
              alt="Know Me" 
              fill
              sizes="28px"
              className="object-cover object-center"
            />
          </a>
          <button className="flex flex-col gap-1.5 p-2" aria-label="Toggle menu">
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
          </button>
        </div>
        
      </div>
    </nav>
  );
}