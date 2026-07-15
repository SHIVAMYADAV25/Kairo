"use client";

import { motion, Variants } from "framer-motion";
import { CheckIcon } from "./icons";

// Directional variants based on your original 'reverse' layout logic
const textVariants = (reverse: boolean): Variants => ({
  hidden: { opacity: 0, x: reverse ? 40 : -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
});

const visualVariants = (reverse: boolean): Variants => ({
  hidden: { opacity: 0, x: reverse ? -40 : 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.1 }
  }
});

export default function DetailRow({
  id,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  reverse = false,
  accent = "text-orange-400",
  bullet = "text-orange-400",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
  accent?: string;
  bullet?: string;
}) {
  return (
    <div id={id} className="py-16">
      <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-16 items-start`}>
        
        {/* Animated Text Block */}
        <motion.div 
          variants={textVariants(reverse)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex-1 min-w-0 lg:sticky lg:top-32"
        >
          <span className={`text-xs font-semibold uppercase tracking-widest ${accent} mb-3 block`}>
            {eyebrow}
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{title}</h3>
          <p className="text-neutral-400 mb-6 leading-relaxed">{description}</p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-neutral-300">
                <CheckIcon className={`w-5 h-5 ${bullet} shrink-0 mt-0.5`} />
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Animated Visual Block */}
        <motion.div 
          variants={visualVariants(reverse)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex-1 min-w-0 w-full"
        >
          {visual}
        </motion.div>
        
      </div>
    </div>
  );
}