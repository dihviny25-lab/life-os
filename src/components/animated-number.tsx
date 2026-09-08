"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";

// Counts up/down to the real value instead of popping in — the numbers on
// this dashboard change often (saldo, contas, progresso), so they should
// feel alive rather than static text.
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: mounted.current ? 0.6 : 0.9,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    mounted.current = true;
    return controls.stop;
  }, [value, format, motionValue]);

  return <span ref={ref}>{format(0)}</span>;
}
