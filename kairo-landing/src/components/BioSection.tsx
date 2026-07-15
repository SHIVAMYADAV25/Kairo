"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Gochi_Hand } from "next/font/google";
import Link from "next/link";

// Initialize the hand-drawn Google font natively
const gochiHand = Gochi_Hand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface BioSectionProps {
  imageSrc: string; // Path to your 'x bio.png'
  maskSrc?: string; // Path to your 'mask.png'
}

const textVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const visualVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.1 }
  }
};

export default function BioSection({ imageSrc, maskSrc = "/mask.png" }: BioSectionProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isTricked, setIsTricked] = useState(false);

  return (
    <section id="about-me" className="relative py-6 select-none">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Animated Text Block */}
        <motion.div 
          variants={textVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex-1 min-w-0"
        >
          {/* Maintained the exact quote requested */}
          <blockquote className="border-l-2 border-orange-500/50 pl-4 my-6 italic text-neutral-300 tracking-wide leading-relaxed">
            &ldquo;Man is made by his belief. As he believes, so he is.&rdquo;
          </blockquote>

          {/* Social Icon Links Group & Call to Action Button Row */}
          <div className="flex flex-wrap items-center gap-6 mt-8">
            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/shivamdotdev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300 active:scale-95"
                aria-label="X Profile"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <a 
                href="https://www.linkedin.com/in/shivamdotdev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300 active:scale-95"
                aria-label="LinkedIn Profile"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                </svg>
              </a>
            </div>

            {/* Inline Action Button Redirecting to /about */}
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 transition-all duration-300 active:scale-95"
            >
              Build your own Kairo
            </Link>
          </div>
        </motion.div>

        {/* Right Side Column layout containing the intact visual metrics */}
        <motion.div 
          variants={visualVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex-1 min-w-0 w-full relative"
        >
          {/* Main Visual Frame Container */}
          <div 
            ref={imageContainerRef}
            className="glass-card rounded-2xl overflow-hidden p-2 bg-white/5 border border-white/10 shadow-2xl tracking-tight max-w-xl mx-auto relative touch-none"
          >
            <img 
              src={imageSrc} 
              alt="Character Illustration" 
              className="w-full h-auto rounded-xl object-cover opacity-90 pointer-events-none select-none"
            />

            {/* Draggable Mask Layer */}
            <motion.div
              drag
              dragConstraints={imageContainerRef}
              dragElastic={0.05}
              dragMomentum={false}
              whileDrag={{ scale: 1.05 }}
              onDragStart={() => setIsTricked(true)}
              className="absolute top-[8%] left-[45%] w-[30%] aspect-square cursor-grab active:cursor-grabbing z-30 select-none"
            >
              <img 
                src={maskSrc} 
                alt="Draggable architectural helmet mask" 
                className="w-full h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] scale-x-[-1] pointer-events-none select-none" 
              />
            </motion.div>
          </div>

          {/* Text block aligned layout frame on the right side threshold */}
          <div className={`absolute top-[42%] left-[103%] z-20 hidden xl:flex items-center gap-2 ${gochiHand.className}`}>
            {/* Message block text */}
            <motion.p 
              key={isTricked ? "tricked" : "prompt"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl text-orange-400 tracking-wide select-none pl-5"
            >
              {isTricked 
                ? "Hahaha, it's anime character bro" 
                : "Yooooo Move the mask"
              }
            </motion.p>
          </div>

          {/* Responsive Mobile Layout Fallback positioning parameters */}
          <div className={`w-full text-center mt-4 xl:hidden ${gochiHand.className}`}>
            <p className="text-xl text-orange-400 tracking-wide">
              {isTricked ? "Hahaha, it's anime character bro" : "Yooooo Move the mask"}
            </p>
          </div>

        </motion.div>
        
      </div>
    </section>
  );
}