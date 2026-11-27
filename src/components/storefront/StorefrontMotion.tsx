"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { gsap, ScrollSmoother, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Skiper19 } from "@/components/ui/skiper-ui/skiper19";

export function StorefrontMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    const media = gsap.matchMedia();
    // Disable smoothscroll on mobile (< 1024px) for 100% native fast touch scrolling
    media.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.2,
        smoothTouch: false,
        normalizeScroll: false,
        ignoreMobileResize: true,
        effects: true,
      });

      return () => smoother.kill();
    });

    return () => media.revert();
  }, { scope: rootRef });

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      rootRef.current?.querySelectorAll<HTMLElement>("[data-gsap-title]").forEach((title) => {
        gsap.from(title, {
          y: 18,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform",
        });
      });

      rootRef.current?.querySelectorAll<HTMLElement>("[data-gsap-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 24,
          autoAlpha: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 90%",
            once: true,
          },
        });
      });

      rootRef.current?.querySelectorAll<HTMLElement>("[data-gsap-grid]").forEach((grid) => {
        gsap.from(grid.children, {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.045,
          scrollTrigger: {
            trigger: grid,
            start: "top 88%",
            once: true,
          },
        });
      });

      rootRef.current?.querySelectorAll<HTMLElement>("[data-gsap-expand]").forEach((element) => {
        gsap.fromTo(element, { scale: 0.9, transformOrigin: "50% 50%" }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: element, start: "top 90%", end: "center 48%", scrub: 0.8 },
        });
      });

      rootRef.current?.querySelectorAll<HTMLElement>("[data-gsap-parallax]").forEach((element) => {
        gsap.fromTo(element, { yPercent: -8 }, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: element.closest("section") ?? element, start: "top bottom", end: "bottom top", scrub: 1.1 },
        });
      });

      ScrollTrigger.refresh();
    });

    return () => media.revert();
  }, { dependencies: [pathname], scope: rootRef, revertOnUpdate: true });

  return (
    <div ref={rootRef} className="storefront-editorial">
      <div id="smooth-wrapper">
        <div id="smooth-content" className="relative">
          {pathname !== "/" && <Skiper19 />}
          <div className="relative z-[2]">{children}</div>
        </div>
      </div>
    </div>
  );
}
