"use client";

import { useEffect, useRef, useState } from "react";
import FluffyCloud from "@/components/FluffyCloud";

type SkyCloud = {
  id: string;
  x: number;
  y: number;
  w: number;
  depth: number;
  delay: number;
};

const START: SkyCloud[] = [
  { id: "c1", x: -6, y: 2, w: 360, depth: 0.22, delay: 0 },
  { id: "c2", x: 58, y: -4, w: 420, depth: 0.18, delay: 1.2 },
  { id: "c3", x: -8, y: 38, w: 280, depth: 0.4, delay: 0.6 },
  { id: "c4", x: 68, y: 36, w: 300, depth: 0.35, delay: 1.8 },
  { id: "c5", x: 18, y: 62, w: 240, depth: 0.55, delay: 0.3 },
  { id: "c6", x: 54, y: 68, w: 270, depth: 0.5, delay: 2.1 },
  { id: "c7", x: 36, y: 8, w: 170, depth: 0.7, delay: 1.4 },
  { id: "c8", x: 78, y: 58, w: 190, depth: 0.65, delay: 0.9 },
  { id: "c9", x: 8, y: 78, w: 210, depth: 0.45, delay: 2.4 },
  { id: "c10", x: 42, y: 48, w: 160, depth: 0.8, delay: 1.6 },
];

function lookAt(
  mouse: { x: number; y: number },
  box: { left: number; top: number; width: number; height: number },
) {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  return {
    x: Math.max(-1, Math.min(1, (mouse.x - cx) / 180)),
    y: Math.max(-1, Math.min(1, (mouse.y - cy) / 140)),
  };
}

export default function CloudField() {
  const layer = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [clouds, setClouds] = useState(START);
  const [popped, setPopped] = useState<string | null>(null);
  const drag = useRef<{
    id: string;
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      setMouse({ x: event.clientX, y: event.clientY });
      const job = drag.current;
      const box = layer.current?.getBoundingClientRect();
      if (!job || !box) return;
      const x = ((event.clientX - job.dx - box.left) / box.width) * 100;
      const y = ((event.clientY - job.dy - box.top) / box.height) * 100;
      job.moved = true;
      setClouds((current) =>
        current.map((cloud) =>
          cloud.id === job.id ? { ...cloud, x, y } : cloud,
        ),
      );
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={layer} className="absolute inset-0 z-[5] overflow-hidden">
      {clouds.map((cloud) => {
        const shiftX = (mouse.x / (typeof window === "undefined" ? 1 : window.innerWidth || 1) - 0.5) * cloud.depth * 36;
        const shiftY = (mouse.y / (typeof window === "undefined" ? 1 : window.innerHeight || 1) - 0.5) * cloud.depth * 24;
        const fakeBox = layer.current?.getBoundingClientRect();
        const width = fakeBox?.width ?? 1200;
        const height = fakeBox?.height ?? 800;
        const box = {
          left: (fakeBox?.left ?? 0) + (cloud.x / 100) * width,
          top: (fakeBox?.top ?? 0) + (cloud.y / 100) * height,
          width: cloud.w,
          height: cloud.w * 0.65,
        };
        const look = lookAt(mouse, box);

        return (
          <button
            key={cloud.id}
            type="button"
            aria-label="Move cloud"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              const rect = event.currentTarget.getBoundingClientRect();
              drag.current = {
                id: cloud.id,
                dx: event.clientX - rect.left,
                dy: event.clientY - rect.top,
                moved: false,
              };
            }}
            onPointerUp={() => {
              if (!drag.current?.moved) {
                setPopped(cloud.id);
                window.setTimeout(() => setPopped(null), 420);
              }
            }}
            className={`absolute cursor-grab bg-transparent p-0 active:cursor-grabbing ${
              popped === cloud.id ? "cloud-pop" : ""
            }`}
            style={{
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              width: cloud.w,
              transform: `translate(${shiftX}px, ${shiftY}px)`,
              zIndex: Math.round(cloud.depth * 10),
            }}
          >
            <span
              className="cloud-float block"
              style={{ animationDelay: `${cloud.delay}s` }}
            >
              <FluffyCloud look={look} className="h-auto w-full overflow-visible" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
