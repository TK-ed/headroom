"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Renders `format(value)` and tweens from the previous value when it changes.
 * Reduced-motion users get the final number straight away.
 */
export function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const el = useRef<HTMLSpanElement>(null);
  const current = useRef({ v: 0 }); // first mount counts up from zero

  useGSAP(
    () => {
      const node = el.current;
      if (!node) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        current.current.v = value;
        node.textContent = format(value);
        return;
      }
      gsap.to(current.current, {
        v: value,
        duration: 0.8,
        ease: "power3.out",
        onUpdate: () => {
          node.textContent = format(current.current.v);
        },
      });
    },
    { dependencies: [value] },
  );

  return (
    <span ref={el} className="tnum">
      {format(value)}
    </span>
  );
}
