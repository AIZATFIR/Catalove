"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Skiper UI #19, adapted as a palette-matched scroll-drawn patisserie flourish. */
export function Skiper19() {
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length * 0.94 });
    const draw = gsap.matchMedia();
    draw.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: () => `+=${ScrollTrigger.maxScroll(window)}`,
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      });
    });
    draw.add("(prefers-reduced-motion: reduce)", () => gsap.set(path, { strokeDashoffset: 0 }));
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    return () => {
      window.removeEventListener("load", refresh);
      draw.revert();
    };
  }, { scope: pathRef });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1920 6200"
      fill="none"
      preserveAspectRatio="none"
      className="skiper19-background pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-hidden opacity-[.26]"
    >
      <path
        ref={pathRef}
        d="M1580 -80C1820 120 1710 330 1460 310C1220 292 1200 560 1450 630C1720 705 1790 890 1530 980C1260 1075 1120 800 1370 800C1640 800 1750 1130 1500 1280C1280 1410 1150 1650 1420 1700C1690 1750 1800 1990 1540 2090C1280 2190 1190 1940 1410 1890C1690 1825 1810 2200 1510 2330C1230 2450 1140 2660 1400 2720C1680 2785 1780 3020 1510 3110C1260 3195 1160 2960 1390 2910C1670 2850 1800 3220 1500 3370C1220 3510 1150 3720 1410 3770C1670 3820 1780 4050 1520 4150C1260 4250 1170 4000 1400 3950C1660 3890 1800 4250 1510 4400C1220 4550 1160 4750 1420 4800C1690 4850 1780 5090 1520 5180C1260 5270 1160 5050 1390 4990C1650 4930 1770 5300 1490 5450C1270 5570 1250 5780 1500 5860C1700 5925 1650 6030 1540 6100"
        stroke="url(#skiper19-sofiz-stroke)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="skiper19-sofiz-stroke" x1="900" y1="0" x2="1400" y2="6200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B8794A" />
          <stop offset="0.52" stopColor="#4D3040" />
          <stop offset="1" stopColor="#7894B4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Skiper 19 — adapted from https://skiper-ui.com/v1/skiper19
 * Free version attribution retained. Original concept inspired by https://comgio.ai/.
 */
