"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types/bakery";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

interface Skiper8Props {
  products?: Product[];
  onComplete?: () => void;
  words?: string[];
}

export function Skiper8({
  products = [],
  onComplete,
  words,
}: Skiper8Props) {
  const settings = useBusinessSettings();
  const isEnabled = Boolean(settings.enable_preloader);

  const dynamicWords = React.useMemo(() => {
    if (words && words.length > 0) return words;
    return [
      settings.store_name || "Catalove Studio",
      "Curated Collection",
      "Quality & Craftsmanship",
      settings.hero_eyebrow || "Signature Series",
    ];
  }, [words, settings.store_name, settings.hero_eyebrow]);

  const [index, setIndex] = useState(0);
  const [percent, setPercent] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(!isEnabled);

  useEffect(() => {
    if (!isEnabled) {
      setHasDismissed(true);
      return;
    }
    try {
      const seen = sessionStorage.getItem("catalove_opening_played");
      if (seen) {
        setHasDismissed(true);
        if (onComplete) onComplete();
      } else {
        setHasDismissed(false);
      }
    } catch {
      // ignore storage error
    }
  }, [isEnabled, onComplete]);

  const realPhotos = React.useMemo(() => {
    return products
      .filter((p) => p.is_active && p.images?.length > 0)
      .map((p) => ({
        name: p.name,
        src: p.images.find((img) => img.is_primary)?.storage_path || p.images[0]?.storage_path,
      }))
      .filter((item) => Boolean(item.src));
  }, [products]);

  useEffect(() => {
    if (hasDismissed || !isEnabled) return;

    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 12) + 8;
        return Math.min(100, prev + step);
      });
    }, 45);

    return () => clearInterval(interval);
  }, [hasDismissed, isEnabled]);

  useEffect(() => {
    if (hasDismissed || !isEnabled) return;
    const wordIndex = Math.min(
      dynamicWords.length - 1,
      Math.floor((percent / 100) * dynamicWords.length)
    );
    setIndex(wordIndex);

    if (percent === 100) {
      const timer = setTimeout(() => {
        setIsFinished(true);
        try {
          sessionStorage.setItem("catalove_opening_played", "true");
        } catch {
          // ignore
        }
        setTimeout(() => {
          setHasDismissed(true);
          if (onComplete) onComplete();
        }, 650);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [percent, dynamicWords.length, hasDismissed, isEnabled, onComplete]);

  const handleSkip = () => {
    setIsFinished(true);
    try {
      sessionStorage.setItem("catalove_opening_played", "true");
    } catch {
      // ignore
    }
    setTimeout(() => {
      setHasDismissed(true);
      if (onComplete) onComplete();
    }, 350);
  };

  if (!isEnabled || hasDismissed) return null;

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
              duration: 0.75,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          exit={{ y: "-100%" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#1A1412] text-[#FAF4EE] p-6 sm:p-12 select-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {currentPhoto && (
            <motion.div
              key={currentPhoto.src}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 0.18, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
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

          <div className="relative z-10 w-full max-w-5xl flex items-center justify-between text-xs tracking-wider uppercase font-semibold text-[#D1A686]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8A572] animate-pulse" />
              <span>{settings.store_name || "Catalove Studio"}</span>
            </div>
            <button
              onClick={handleSkip}
              className="cursor-pointer border-b border-[#D1A686]/40 hover:border-[#E8A572] text-[11px] text-[#FAF4EE]/70 hover:text-white transition-colors py-1"
            >
              Lewati (Skip)
            </button>
          </div>

          <div className="relative z-10 my-auto text-center flex flex-col items-center">
            <div className="overflow-hidden min-h-[4rem] sm:min-h-[6rem] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={dynamicWords[index]}
                  initial={{ y: 50, opacity: 0, filter: "blur(6px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -50, opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-serif text-4xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-[#FAF4EE]"
                >
                  {dynamicWords[index]}
                </motion.h1>
              </AnimatePresence>
            </div>

            {currentPhoto && (
              <motion.p
                key={`prod-${currentPhoto.name}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                className="mt-3 text-xs tracking-widest uppercase text-[#D1A686]"
              >
                Koleksi: {currentPhoto.name}
              </motion.p>
            )}
          </div>

          <div className="relative z-10 w-full max-w-5xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#D8CBC0]">
              <span>Menyiapkan etalase toko...</span>
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
