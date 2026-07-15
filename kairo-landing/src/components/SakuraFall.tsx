"use client";

import { useEffect, useState } from "react";

export default function SakuraFall() {
  const [petals, setPetals] = useState<number[]>([]);

  useEffect(() => {
    // 35 petals for a rich, instant spread across the canvas depth
    setPetals(Array.from({ length: 35 }, (_, i) => i));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 w-full min-h-full">
      {petals.map((id) => {
        const left = Math.random() * 100;
        // Negative delay tricks the engine to render them mid-air instantly on layout paint
        const delay = Math.random() * -20; 
        const duration = 10 + Math.random() * 8; 
        const scale = 0.4 + Math.random() * 0.5; 

        return (
          <div
            key={id}
            /* Made the background rose scale darker and less translucent */
            className="absolute bg-rose-500/40 border border-rose-400/20 animate-sakura-fall"
            style={{
              top: "-5%",
              left: `${left}%`,
              width: `${scale * 10}px`,
              height: `${scale * 7}px`,
              borderRadius: "50% 0% 50% 50%", 
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
            }}
          />
        );
      })}

      <style jsx global>{`
        @keyframes sakuraFall {
          0% {
            transform: translateY(-5vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          5% {
            /* Increased mid-fall opacity base limit to make them stand out dark */
            opacity: 0.85;
          }
          90% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) translateX(100px) rotate(540deg);
            opacity: 0;
          }
        }
        .animate-sakura-fall {
          animation-name: sakuraFall;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}