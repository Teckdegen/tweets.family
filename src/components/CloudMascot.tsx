"use client";

import { useEffect, useRef, useState } from "react";
import FluffyCloud from "@/components/FluffyCloud";

export default function CloudMascot({ className }: { className?: string }) {
  const root = useRef<HTMLButtonElement>(null);
  const lastMove = useRef(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [pop, setPop] = useState(false);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      lastMove.current = Date.now();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      setLook({
        x: Math.max(-1, Math.min(1, (event.clientX - cx) / 140)),
        y: Math.max(-1, Math.min(1, (event.clientY - cy) / 110)),
      });
    };

    let frame = 0;
    let t = 0;
    const tick = () => {
      if (Date.now() - lastMove.current > 1200) {
        t += 0.028;
        setLook({
          x: Math.sin(t) * 0.72,
          y: Math.sin(t * 0.55) * 0.32,
        });
      }
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      ref={root}
      type="button"
      aria-label="Cloud"
      onClick={() => {
        setPop(true);
        window.setTimeout(() => setPop(false), 420);
      }}
      className={`inline-flex cursor-pointer items-center justify-center bg-transparent p-0 ${pop ? "cloud-pop" : ""} ${className ?? ""}`}
    >
      <FluffyCloud look={look} className="h-full w-full overflow-visible" />
    </button>
  );
}
