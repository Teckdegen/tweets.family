"use client";

import { monotonePath } from "@/lib/chart";

export default function EngagementChart({
  series,
  target,
  line,
}: {
  series: number[];
  target?: number;
  line?: number;
}) {
  const W = 720;
  const H = 280;
  const pad = { l: 56, r: 16, t: 18, b: 32 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const min = 0;
  const max = Math.max(...series, target ?? 0) * 1.08;
  const points = series.map((value, i) => {
    const x = pad.l + (i / (series.length - 1)) * innerW;
    const y = pad.t + (1 - (value - min) / (max - min)) * innerH;
    return [x, y] as [number, number];
  });
  const last = points[points.length - 1];
  const linePath = monotonePath(points);
  const area = `${linePath} L ${last[0].toFixed(1)} ${H - pad.b} L ${points[0][0].toFixed(1)} ${H - pad.b} Z`;
  const targetY = target == null ? 0 : pad.t + (1 - target / max) * innerH;
  const ticks = [0, 0.5, 1].map((t) => ({
    y: pad.t + innerH * (1 - t),
    label: Math.round(max * t).toLocaleString("en-US"),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full sm:h-[300px]" role="img" aria-label="Engagement over time">
      <defs>
        <linearGradient id="eng-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F6BFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2F6BFF" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={tick.y}
            y2={tick.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <text x={pad.l - 8} y={tick.y + 4} textAnchor="end" fill="#9aafbc" fontSize="12" fontWeight="600">
            {tick.label}
          </text>
        </g>
      ))}
      {target != null && line != null ? (
        <>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={targetY}
            y2={targetY}
            stroke="#e0a106"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <text x={W - pad.r} y={targetY - 6} textAnchor="end" fill="#b8860b" fontSize="12" fontWeight="700">
            {line}x target
          </text>
        </>
      ) : null}
      <path d={area} fill="url(#eng-fill)" />
      <path d={linePath} fill="none" stroke="#2F6BFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill="#2F6BFF" />
      <circle cx={last[0]} cy={last[1]} r="8.5" fill="none" stroke="#2F6BFF" strokeOpacity="0.35" />
      {["2h", "1h", "Now"].map((label, i) => (
        <text
          key={label}
          x={pad.l + (i / 2) * innerW}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
          fill="#9aafbc"
          fontSize="12"
          fontWeight="600"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
