"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export interface AccentPalette {
  id: string;
  name: string;
  color: string;
  glow: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  { id: "amber", name: "Amber Flame", color: "#B45309", glow: "rgba(180, 83, 9, 0.22)" },
  { id: "cyan", name: "Electric Cyan", color: "#00d2ff", glow: "rgba(0, 210, 255, 0.4)" },
  { id: "emerald", name: "Emerald Mint", color: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },
  { id: "violet", name: "Cyber Violet", color: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
  { id: "crimson", name: "Crimson Rose", color: "#f43f5e", glow: "rgba(244, 63, 94, 0.4)" },
  { id: "gold", name: "Solar Gold", color: "#eab308", glow: "rgba(234, 179, 8, 0.4)" },
  { id: "lime", name: "Neon Lime", color: "#84cc16", glow: "rgba(132, 204, 22, 0.4)" },
  { id: "indigo", name: "Deep Indigo", color: "#6366f1", glow: "rgba(99, 102, 241, 0.4)" },
  { id: "coral", name: "Coral Peach", color: "#fb7185", glow: "rgba(251, 113, 133, 0.4)" },
];

/**
 * Skiper24 - Dynamic Accent Color Palette Switcher (@skiper-ui/skiper24)
 * Allows users to customize accent theme highlights across the storefront.
 */
export function Skiper24({ className = "" }: { className?: string }) {
  const [selectedId, setSelectedId] = useState("amber");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const manualId = sessionStorage.getItem("catalove-manual-accent");
    if (manualId) {
      const found = ACCENT_PALETTES.find((p) => p.id === manualId);
      if (found) applyPalette(found, false);
    }

    const handleSettingsChange = () => {
      sessionStorage.removeItem("catalove-manual-accent");
    };
    window.addEventListener("catalove-settings-change", handleSettingsChange);
    return () => window.removeEventListener("catalove-settings-change", handleSettingsChange);
  }, []);

  const applyPalette = (palette: AccentPalette, markManual = true) => {
    setSelectedId(palette.id);
    document.documentElement.style.setProperty("--color-orange", palette.color);
    document.documentElement.style.setProperty("--color-orange-glow", palette.glow);
    document.documentElement.style.setProperty("--storefront-accent", palette.color);
    document.documentElement.style.setProperty("--color-accent", palette.color);
    document.documentElement.style.setProperty("--color-accent-glow", palette.glow);
    localStorage.setItem("sofiz-accent-color", palette.id);
    localStorage.setItem("zafir-accent-color", palette.id);
    if (markManual) {
      sessionStorage.setItem("catalove-manual-accent", palette.id);
    }
  };

  const currentPalette = ACCENT_PALETTES.find((p) => p.id === selectedId) || ACCENT_PALETTES[0];

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-full border border-black/10 dark:border-white/10 ${className}`} />
    );
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Trigger Button - Apple-style glass circle */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full border border-black/10 bg-white/75 dark:border-white/10 dark:bg-black/35 shadow-sm backdrop-blur-md transition-colors cursor-pointer select-none"
        title={`Tema Aksen: ${currentPalette.name}`}
        aria-label="Pilih Warna Tema Aksen"
      >
        <span
          className="w-4 h-4 rounded-full transition-all duration-300"
          style={{
            backgroundColor: currentPalette.color,
            boxShadow: `0 0 10px ${currentPalette.color}`,
          }}
        />
      </motion.button>

      {/* Palette Pop-over Swatches */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 380 }}
              className="absolute right-0 top-full mt-2.5 z-50 p-2.5 rounded-2xl bg-white/90 dark:bg-[#2C2421]/95 border border-black/10 dark:border-white/15 shadow-2xl flex items-center gap-1.5 backdrop-blur-2xl"
            >
              {ACCENT_PALETTES.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      applyPalette(p);
                      setIsOpen(false);
                    }}
                    className="relative w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer shadow-sm focus:outline-none"
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                    type="button"
                  >
                    {isSelected && <Check size={12} className="text-white drop-shadow-md stroke-[3]" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Skiper24;
