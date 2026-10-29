"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, SkipBack, Music, ListMusic, X } from "lucide-react";
import { SOFIZ_PLAYLIST, type Track } from "@/lib/data/playlist-data";

export interface Skiper25Props {
  playlist?: Track[];
  className?: string;
}

/**
 * Skiper25 - Interactive Sofiz BGM Music Player & Drawer Queue
 * Ported with full 27-track playlist, animated waveform, next/prev, and queue selector.
 */
export function Skiper25({
  playlist = SOFIZ_PLAYLIST,
  className = "",
}: Skiper25Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = playlist[currentIndex] || playlist[0];

  // Initialize and load track
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentTrack.src);
      audioRef.current.volume = 0.45;
    } else {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.src;
      if (wasPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }

    const handleEnded = () => {
      // Auto advance to next song in queue
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    };

    const audio = audioRef.current;
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, playlist]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Smooth Volume Fade In / Out Toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    if (isPlaying) {
      let vol = audio.volume;
      fadeIntervalRef.current = setInterval(() => {
        if (vol > 0.05) {
          vol -= 0.08;
          audio.volume = Math.max(0, vol);
        } else {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          audio.pause();
          audio.volume = 0.45;
          setIsPlaying(false);
        }
      }, 35);
    } else {
      audio.volume = 0.05;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            let vol = 0.05;
            fadeIntervalRef.current = setInterval(() => {
              if (vol < 0.45) {
                vol += 0.06;
                audio.volume = Math.min(0.45, vol);
              } else {
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                audio.volume = 0.45;
              }
            }, 35);
          })
          .catch((err) => {
            console.warn("Audio playback prevented:", err);
          });
      }
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    if (!isPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 50);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    if (!isPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 50);
    }
  };

  const selectTrack = (idx: number) => {
    setCurrentIndex(idx);
    setShowPlaylistModal(false);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 50);
  };

  const barVariants = [
    { playing: [4, 16, 6, 14, 4], duration: 0.55 },
    { playing: [14, 6, 18, 8, 12], duration: 0.45 },
    { playing: [6, 18, 8, 16, 6], duration: 0.6 },
    { playing: [16, 8, 14, 4, 14], duration: 0.48 },
  ];

  return (
    <div
      className={`relative inline-flex items-center gap-1 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Music Pill Button - Apple fluid pill style */}
      <div className="flex items-center rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 p-0.5 shadow-sm backdrop-blur-md transition-colors">
        {/* Previous Track Button */}
        <button
          onClick={handlePrev}
          type="button"
          className="p-1.5 text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white rounded-full transition-colors cursor-pointer"
          title="Lagu Sebelumnya"
          aria-label="Previous Track"
        >
          <SkipBack size={13} />
        </button>

        {/* Play/Pause Main Trigger with Waveform */}
        <motion.button
          onClick={togglePlay}
          type="button"
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer font-sans text-xs font-semibold ${
            isPlaying
              ? "bg-white/90 text-[var(--storefront-accent,#ff6f1e)] shadow-sm dark:bg-[#392E2B]"
              : "text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white"
          }`}
          title={isPlaying ? "Jeda Musik" : "Putar Musik"}
        >
          {/* Animated Equalizer Waveform Bars */}
          <div className="flex items-center gap-[2.5px] h-4 w-4 justify-center overflow-hidden">
            {barVariants.map((v, i) => (
              <motion.span
                key={i}
                className={`w-[2.5px] rounded-full transition-colors ${
                  isPlaying ? "bg-[var(--storefront-accent,#ff6f1e)]" : "bg-current opacity-60"
                }`}
                animate={
                  isPlaying
                    ? {
                        height: v.playing,
                        transition: {
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: v.duration,
                          ease: "easeInOut",
                        },
                      }
                    : { height: 3 }
                }
                style={{ minHeight: 3 }}
              />
            ))}
          </div>

          <span className="hidden sm:inline-block text-[11px] font-medium tracking-tight">
            {isPlaying ? "PUTAR" : "BGM"}
          </span>
        </motion.button>

        {/* Next Track Button */}
        <button
          onClick={handleNext}
          type="button"
          className="p-1.5 text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white rounded-full transition-colors cursor-pointer"
          title="Lagu Berikutnya"
          aria-label="Next Track"
        >
          <SkipForward size={13} />
        </button>

        {/* Playlist Selector Popover Trigger */}
        <button
          onClick={() => setShowPlaylistModal((prev) => !prev)}
          type="button"
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            showPlaylistModal
              ? "text-[var(--storefront-accent,#ff6f1e)] bg-white/80 dark:bg-white/20"
              : "text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white"
          }`}
          title={`Daftar Putar (${playlist.length} Lagu)`}
          aria-label="Buka Daftar Putar Musik"
        >
          <ListMusic size={13} />
        </button>
      </div>

      {/* Floating Track Info Tooltip on Hover */}
      <AnimatePresence>
        {isHovered && !showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 z-50 whitespace-nowrap px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#2C2421]/95 border border-black/10 dark:border-white/15 shadow-xl flex items-center gap-2 pointer-events-none backdrop-blur-xl"
          >
            <Music size={12} className="text-[var(--storefront-accent,#ff6f1e)] animate-pulse" />
            <span className="text-[11px] font-medium text-[#4D3040] dark:text-[#FAF4EE] max-w-[220px] truncate">
              {currentTrack.artist} - {currentTrack.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Playlist Selection Drawer / Popover (27 tracks) */}
      <AnimatePresence>
        {showPlaylistModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPlaylistModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="absolute top-full right-0 mt-2 w-72 sm:w-84 max-h-88 rounded-2xl bg-white/95 dark:bg-[#251E1C]/95 border border-black/10 dark:border-white/15 shadow-2xl p-3 z-50 backdrop-blur-2xl flex flex-col gap-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10 px-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--storefront-accent,#ff6f1e)] uppercase tracking-wider">
                  <Music size={14} />
                  <span>Daftar Putar ({playlist.length})</span>
                </div>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  type="button"
                  className="text-xs text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white p-1 rounded-full transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Track List */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-72 pr-1 divide-y divide-black/5 dark:divide-white/5">
                {playlist.map((track, idx) => {
                  const isSelected = idx === currentIndex;
                  return (
                    <button
                      key={track.id || idx}
                      onClick={() => selectTrack(idx)}
                      type="button"
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? "bg-black/5 dark:bg-white/10 text-[var(--storefront-accent,#ff6f1e)] font-bold border border-[var(--storefront-accent,#ff6f1e)]/30"
                          : "text-[#55464B] dark:text-[#D8CBC0] hover:text-[#4D3040] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[10px] opacity-60 w-5 text-right shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="truncate">
                          <div className="truncate text-[12px] font-medium text-[#4D3040] dark:text-[#FAF4EE]">
                            {track.title}
                          </div>
                          <div className="truncate text-[10px] opacity-70">
                            {track.artist}
                          </div>
                        </div>
                      </div>

                      {isSelected && isPlaying && (
                        <span className="flex items-center gap-[2.5px] h-3 shrink-0">
                          <span className="w-1 h-3 bg-[var(--storefront-accent,#ff6f1e)] rounded-full animate-bounce" />
                          <span className="w-1 h-2 bg-[var(--storefront-accent,#ff6f1e)] rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-3 bg-[var(--storefront-accent,#ff6f1e)] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Skiper25;
