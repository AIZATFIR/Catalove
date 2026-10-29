"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function MotionIcon({
  icon: Icon,
  className,
  size = 18,
}: {
  icon: LucideIcon;
  className?: string;
  size?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={`inline-flex shrink-0 ${className ?? ""}`}
      whileHover={reduceMotion ? undefined : { y: -2, rotate: [0, -8, 6, 0] }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <Icon size={size} strokeWidth={1.7} />
    </motion.span>
  );
}
