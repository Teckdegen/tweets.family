"use client";

import { MAX_MINUTES, lineAtMinute, type Line } from "@/lib/quote";

export default function MinuteSlider({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (minutes: number, line: Line) => void;
}) {
  const line = lineAtMinute(minutes);
  const pct = (minutes / MAX_MINUTES) * 100;
  const labelAt = Math.min(88, Math.max(12, pct));

  return (
    <div
      className="select-none"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-end gap-2">
        <span className="pb-px text-[12px] font-semibold text-white/55 tabular-nums">0</span>
        <div className="relative h-8 min-w-0 flex-1">
          <span
            className="pointer-events-none absolute top-0 -translate-x-1/2 text-[11px] font-semibold text-white tabular-nums"
            style={{ left: `${labelAt}%` }}
          >
            {minutes}m
          </span>
          <div className="absolute top-[22px] right-0 left-0 h-[3px] rounded-full bg-[#ff4d8d]" />
          <div
            className="absolute top-[22px] left-0 h-[3px] rounded-full bg-[#3dffb0]"
            style={{ width: `${pct}%` }}
          />
          <div
            className="pointer-events-none absolute top-[23.5px] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#e8fff4] shadow-[0_0_0_3px_rgba(61,255,176,0.28)]"
            style={{ left: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={MAX_MINUTES}
            step={1}
            value={minutes}
            aria-label="Minutes"
            aria-valuemin={0}
            aria-valuemax={MAX_MINUTES}
            aria-valuenow={minutes}
            aria-valuetext={`${minutes} minutes, ${line}x`}
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange(next, lineAtMinute(next));
            }}
            className="absolute inset-0 z-10 w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
        </div>
        <span className="pb-px text-[12px] font-semibold text-white/55 tabular-nums">60m</span>
      </div>
    </div>
  );
}
