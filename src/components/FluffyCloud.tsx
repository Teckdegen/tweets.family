"use client";

import { useId } from "react";

export default function FluffyCloud({
  look = { x: 0, y: 0 },
  className,
}: {
  look?: { x: number; y: number };
  className?: string;
}) {
  const rawId = useId().replace(/:/g, "");
  const shadowId = `${rawId}-shadow`;
  const px = look.x * 7;
  const py = look.y * 5.5;

  return (
    <svg
      viewBox="0 0 260 170"
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <filter id={shadowId} x="-20%" y="-10%" width="140%" height="150%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="10"
            floodColor="#6aa9c4"
            floodOpacity="0.28"
          />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <ellipse cx="78" cy="110" rx="60" ry="40" fill="#ffffff" />
        <ellipse cx="132" cy="78" rx="66" ry="54" fill="#ffffff" />
        <ellipse cx="186" cy="106" rx="56" ry="40" fill="#ffffff" />
        <ellipse cx="46" cy="102" rx="34" ry="28" fill="#ffffff" />
        <ellipse cx="218" cy="98" rx="30" ry="24" fill="#ffffff" />
        <ellipse cx="132" cy="124" rx="78" ry="28" fill="#ffffff" />
      </g>
      <g className="cloud-eye">
        <ellipse
          cx="108"
          cy="98"
          rx="16"
          ry="19"
          fill="#ffffff"
          stroke="#d2eaf3"
          strokeWidth="3"
        />
        <circle cx={108 + px} cy={98 + py} r="7.4" fill="#1b2833" />
        <circle cx={105.5 + px} cy={95.2 + py} r="2.3" fill="#ffffff" />
      </g>
      <g className="cloud-eye cloud-eye-right">
        <ellipse
          cx="150"
          cy="98"
          rx="16"
          ry="19"
          fill="#ffffff"
          stroke="#d2eaf3"
          strokeWidth="3"
        />
        <circle cx={150 + px} cy={98 + py} r="7.4" fill="#1b2833" />
        <circle cx={147.5 + px} cy={95.2 + py} r="2.3" fill="#ffffff" />
      </g>
    </svg>
  );
}
