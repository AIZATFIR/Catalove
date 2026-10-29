"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types/bakery";

interface Skiper8Props {
  products?: Product[];
  onComplete?: () => void;
  words?: string[];
}

const DEFAULT_WORDS = [
  "SofizCake",
  "Artisan Bakery",
  "Bespoke Cakery",
  "Homemade with Love",
  "Fresh from the Oven",
];

export function Skiper8({
  products = [],
  onComplete,
  words = DEFAULT_WORDS,
}: Skiper8Props) {
  const [index, setIndex] = useState(0);
  const [percent, setPercent] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  // Filter real cake photos from database products
  const realPhotos = React.useMemo(() => {
    return products
      .filter((p) => p.is_active && p.images?.length > 0)
      .map((p) => ({
        name: p.name,
        src: p.images.find((img) => img.is_primary)?.storage_path || p.images[0]?.storage_path,
      }))
      .filter((item) => Boolean(item.src));
  }, [products]);

  // Check sessionStorage so opening only plays once per session
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("sofizcake_opening_played");
      if (seen) {
        setHasDismissed(true);
        if (onComplete) onComplete();
      }
    } catch {
      // ignore storage error
    }
  }, [onComplete]);

  // Counter & word cycling
  useEffect(() => {
    if (hasDismissed) return;

    // Progress counter (0 to 100)
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(100, prev + step);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [hasDismissed]);

  // Cycle words based on percent
  useEffect(() => {
    if (hasDismissed) return;
    const wordIndex = Math.min(
      words.length - 1,
      Math.floor((percent / 100) * words.length)
    );
    setIndex(wordIndex);

    if (percent === 100) {
      const timer = setTimeout(() => {
        setIsFinished(true);
        try {
          sessionStorage.setItem("sofizcake_opening_played", "true");
        } catch {
          // ignore
        }
        setTimeout(() => {
          setHasDismissed(true);
          if (onComplete) onComplete();
        }, 800);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [percent, words.length, hasDismissed, onComplete]);

  const handleSkip = () => {
    setIsFinished(true);
    try {
      sessionStorage.setItem("sofizcake_opening_played", "true");
    } catch {
      // ignore
    }
    setTimeout(() => {
      setHasDismissed(true);
      if (onComplete) onComplete();
    }, 400);
  };

  if (hasDismissed) return null;

  const currentPhoto = realPhotos.length > 0 ? realPhotos[index % realPhotos.length] : null;

  return (
    <AnimatePresence>
      {!hasDismissed && (
        <motion.div
          key="skiper8-preloader"
          initial={{ y: 0 }}
          animate={{
            y: isFinished ? "-100%" : 0,
            transition: {
              duration: 0.85,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          exit={{ y: "-100%" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#1A1412] text-[#FAF4EE] p-6 sm:p-12 select-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {/* Subtle real cake photo background preview */}
          {currentPhoto && (
            <motion.div
              key={currentPhoto.src}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 0.18, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 pointer-events-none"
            >
              <Image
                src={currentPhoto.src}
                alt={currentPhoto.name}
                fill
                priority
                className="object-cover filter blur-[2px] opacity-40 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-[#1A1412]/80 to-[#1A1412]/60" />
            </motion.div>
          )}

          {/* Top Bar: Brand & Skip */}
          <div className="relative z-10 w-full max-w-5xl flex items-center justify-between text-xs tracking-wider uppercase font-semibold text-[#D1A686]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8A572] animate-pulse" />
              <span>Dapur SofizCake</span>
            </div>
            <button
              onClick={handleSkip}
              className="cursor-pointer border-b border-[#D1A686]/40 hover:border-[#E8A572] text-[11px] text-[#FAF4EE]/70 hover:text-white transition-colors py-1"
            >
              Lewati (Skip)
            </button>
          </div>

          {/* Center: Animated Word Transition */}
          <div className="relative z-10 my-auto text-center flex flex-col items-center">
            <div className="overflow-hidden min-h-[4rem] sm:min-h-[6rem] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={words[index]}
                  initial={{ y: 50, opacity: 0, filter: "blur(6px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -50, opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="font-serif text-4xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-[#FAF4EE]"
                >
                  {words[index]}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Cake Name Indicator if photo is shown */}
            {currentPhoto && (
              <motion.p
                key={`cake-${currentPhoto.name}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                className="mt-3 text-xs tracking-widest uppercase text-[#D1A686]"
              >
                Koleksi: {currentPhoto.name}
              </motion.p>
            )}
          </div>

          {/* Bottom Bar: Loading Percent & Animated Progress Bar */}
          <div className="relative z-10 w-full max-w-5xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#D8CBC0]">
              <span>Persiapan etalase kue...</span>
              <span className="font-semibold text-[#E8A572] tabular-nums">{percent}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#B8794A] to-[#E8A572]"
                style={{ width: `${percent}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Skiper8;
