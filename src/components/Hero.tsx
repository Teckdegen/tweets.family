"use client";

import { useLayoutEffect, useRef, useState } from "react";
import MiniPost from "@/components/MiniPost";
import { POSTS, type Multiplier, type Post } from "@/data/posts";
import { useNotify } from "@/components/NotifyProvider";

const CHARTS: Record<string, number[]> = {
  "@nova": [6.1, 6.4, 5.9, 7.2, 6.8, 8.1, 7.4, 9.0, 8.3, 10.2, 9.6, 11.4, 10.8, 12.6, 11.9, 13.4, 12.8, 14.1, 13.6, 14.8, 14.2, 15.1, 14.9, 15.2],
  "@mira": [5.4, 5.6, 5.2, 5.9, 6.1, 5.8, 6.4, 6.2, 6.9, 6.5, 7.1, 6.8, 7.4, 7.0, 7.6, 7.3, 7.8, 7.5, 8.0, 7.7, 8.2, 8.0, 8.3, 8.1],
  "@jax": [3.4, 3.6, 3.3, 3.8, 3.5, 3.2, 3.6, 3.1, 2.9, 3.2, 2.8, 2.6, 2.9, 2.5, 2.4, 2.7, 2.3, 2.2, 2.5, 2.1, 2.0, 2.3, 2.1, 2.0],
  "@rio": [8.2, 8.8, 8.1, 9.6, 9.2, 11.0, 10.4, 12.8, 12.1, 14.6, 13.8, 16.4, 15.7, 18.2, 17.4, 20.1, 19.2, 22.0, 21.1, 23.4, 22.8, 24.6, 24.1, 25.0],
  "@kai": [3.8, 3.9, 3.7, 4.1, 4.0, 4.3, 4.1, 4.5, 4.3, 4.6, 4.4, 4.7, 4.6, 4.9, 4.7, 5.0, 4.8, 5.1, 5.0, 5.2, 5.1, 5.3, 5.2, 5.0],
};

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function Sparkline({ post }: { post: Post }) {
  const values = CHARTS[post.handle] ?? CHARTS["@nova"];
  const down = post.change.startsWith("-");
  const stroke = down ? "#e05670" : "#1a8aaa";
  const fillTop = down ? "rgba(224,86,112,0.32)" : "rgba(26,138,170,0.34)";
  const fillBot = down ? "rgba(224,86,112,0.02)" : "rgba(26,138,170,0.02)";
  const gid = `odds-fill-${post.handle.replace("@", "")}`;
  const gidLine = `odds-line-${post.handle.replace("@", "")}`;

  const W = 676;
  const H = 166;
  const pad = { l: 44, r: 16, t: 14, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const min = Math.min(...values) * 0.82;
  const max = Math.max(...values) * 1.08;
  const points = values.map((value, i) => {
    const x = pad.l + (i / (values.length - 1)) * innerW;
    const y = pad.t + (1 - (value - min) / (max - min)) * innerH;
    return [x, y] as [number, number];
  });
  const last = points[points.length - 1];
  const line = smoothPath(points);
  const area = `${line} L ${last[0].toFixed(1)} ${H - pad.b} L ${points[0][0].toFixed(1)} ${H - pad.b} Z`;
  const ticks = [0, 0.33, 0.66, 1].map((t) => ({
    y: pad.t + innerH * (1 - t),
    label: `${(min + (max - min) * t).toFixed(0)}x`,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-[140px] w-full overflow-hidden sm:h-[154px]"
      aria-hidden
      style={{ fontFamily: "Satoshi, var(--font-manrope), sans-serif" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor={fillBot} />
        </linearGradient>
        <linearGradient id={gidLine} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={stroke} />
        </linearGradient>
        <filter id={`${gid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor={stroke} floodOpacity="0.35" />
        </filter>
      </defs>

      {ticks.map((tick) => (
        <g key={tick.label}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={tick.y}
            y2={tick.y}
            stroke="rgba(42,77,92,0.16)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <text
            x={pad.l - 8}
            y={tick.y + 3.5}
            textAnchor="end"
            fill="#6b8a96"
            fontSize="11"
            fontWeight="700"
          >
            {tick.label}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#${gidLine})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gid}-glow)`}
      />

      <circle cx={last[0]} cy={last[1]} r="9" fill="white" />
      <circle cx={last[0]} cy={last[1]} r="5.4" fill={stroke} />

      {["24h", "12h", "6h", "Now"].map((label, i) => (
        <text
          key={label}
          x={pad.l + (i / 3) * innerW}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}
          fill="#7a96a0"
          fontSize="11"
          fontWeight="600"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

export default function Hero() {
  const featured = POSTS.nova;
  const notify = useNotify();
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const card = cardRef.current;
    if (!frame || !card) return;

    const fit = () => {
      const availW = frame.clientWidth;
      const availH = frame.clientHeight;
      const needW = card.scrollWidth;
      const needH = card.scrollHeight;
      if (!availW || !availH || !needW || !needH) return;
      setScale(Math.min(1, availW / needW, availH / needH));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(card);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  function placeBet(mult: Multiplier) {
    notify({
      title: `Bet ${mult} on ${featured.handle}`,
      body: `You priced this tweet's engagement at ${mult}`,
      avatar: featured.avatar,
    });
  }

  return (
    <section
      id="live"
      className="hero-ice relative flex h-full min-h-full w-full items-center justify-center overflow-hidden px-4 py-5 sm:px-6"
    >
      <div
        ref={frameRef}
        className="flex h-full w-full items-center justify-center"
      >
        <div
          ref={cardRef}
          className="flex w-full max-w-[676px] flex-col gap-4"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <MiniPost
            post={featured}
            variant="ice"
            layout="row"
            size="lg"
            onBet={placeBet}
          />
          <section className="rounded-[36px] border border-white/55 bg-white/40 px-5 pt-4 pb-3 shadow-[0_10px_28px_rgba(90,160,185,0.12)] backdrop-blur-xl sm:px-6">
            <div className="flex items-end justify-between px-0.5">
              <p className="text-[15px] font-medium tracking-wide text-[#7a96a0]">
                Live odds
              </p>
              <span className="text-[16px] font-semibold text-[#4db392]">
                ▲ {featured.change}
              </span>
            </div>
            <Sparkline post={featured} />
          </section>
        </div>
      </div>
    </section>
  );
}
