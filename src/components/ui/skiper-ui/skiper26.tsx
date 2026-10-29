"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Skiper26 - Animated Sliding & View-Transition Theme Toggle (@skiper-ui/skiper26)
 * Smooth pill slider with spring animation and circular view-transition.
 */
export function Skiper26({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = (e: React.MouseEvent) => {
    const nextTheme = isDark ? "light" : "dark";

    try {
      if (typeof document !== "undefined" && "startViewTransition" in document && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e?.clientX || rect.left + rect.width / 2;
        const y = e?.clientY || rect.top + rect.height / 2;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const transition = (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });

        if (transition?.ready) {
          transition.ready.then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 500,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          }).catch(() => {
            // view transition animation fallback
          });
        }
      } else {
        setTheme(nextTheme);
      }
    } catch {
      setTheme(nextTheme);
    }
  };

  if (!mounted) {
    return (
      <div className={`w-14 h-8 rounded-full border border-black/10 dark:border-white/10 ${className}`} />
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center justify-between p-1 w-14 h-8 rounded-full border border-black/10 bg-white/75 dark:border-white/15 dark:bg-black/35 shadow-sm backdrop-blur-md transition-colors cursor-pointer select-none ${className}`}
      title={isDark ? "Beralih ke Tampilan Terang" : "Beralih ke Tampilan Gelap"}
      aria-label="Toggle Mode Gelap/Terang"
    >
      {/* Sliding Active Pill with Smooth Relaxed Spring */}
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 24,
          mass: 0.8,
        }}
        className={`absolute w-6 h-6 rounded-full bg-white dark:bg-[#322825] border border-black/10 dark:border-white/10 flex items-center justify-center shadow-md ${
          isDark ? "right-1" : "left-1"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sun size={13} className="text-[#B8794A] dark:text-[#E8A572]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Moon size={13} className="text-[var(--storefront-accent,#ff6f1e)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Static Sun & Moon icons on background track */}
      <div className="w-full flex items-center justify-between px-1.5 pointer-events-none opacity-40">
        <Sun size={11} className="text-[#55464B] dark:text-[#D8CBC0]" />
        <Moon size={11} className="text-[#55464B] dark:text-[#D8CBC0]" />
      </div>
    </motion.button>
  );
}

export default Skiper26;
