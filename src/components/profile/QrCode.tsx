"use client";

import { useMemo } from "react";
import QRCode from "qrcode";

// Soft-cornered QR: finder corners drawn as rounded squares, data modules slightly rounded.
// Module size/rounding is tuned to still decode (0.84 wide / rx 0.32 dots failed to scan).
export default function QrCode({ value, size = 216, color = "#ffffff" }: { value: string; size?: number; color?: string }) {
  const { count, cells } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const isFinder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const list: [number, number][] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.modules.get(r, c) && !isFinder(r, c)) list.push([r, c]);
      }
    }
    return { count: n, cells: list };
  }, [value]);

  const finders: [number, number][] = [
    [0, 0],
    [0, count - 7],
    [count - 7, 0],
  ];

  return (
    <svg viewBox={`-1 -1 ${count + 2} ${count + 2}`} width={size} height={size} role="img" aria-label="Deposit address QR code">
      {cells.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c + 0.03} y={r + 0.03} width={0.94} height={0.94} rx={0.25} fill={color} />
      ))}
      {finders.map(([r, c]) => (
        <g key={`f-${r}-${c}`}>
          <rect x={c + 0.5} y={r + 0.5} width={6} height={6} rx={1.8} fill="none" stroke={color} strokeWidth={1} />
          <rect x={c + 2} y={r + 2} width={3} height={3} rx={0.9} fill={color} />
        </g>
      ))}
    </svg>
  );
}
