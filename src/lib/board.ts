import type { Market } from "@/data/markets";
import type { Line } from "@/lib/quote";

export type LineSide = { line: Line; pct: number };

export type BoardStats = {
  multiple: number;
  move: number;
  volume: number;
  openInterest: number;
  ending: number | null;
  age: number;
  line: Line;
  left: LineSide;
  right: LineSide;
};

export function boardStats(market: Market): BoardStats {
  const open = market.series[0] || 1;
  const recent = market.series[Math.max(0, market.series.length - 8)] || open;
  const byLine = new Map<Line, number>();
  let volume = 0;
  let openInterest = 0;
  let ending: number | null = null;
  for (const trade of market.trades) {
    volume += trade.amount;
    byLine.set(trade.line, (byLine.get(trade.line) ?? 0) + trade.amount);
    if (trade.status === "open") {
      openInterest += trade.amount;
      ending = ending == null ? trade.minutes : Math.min(ending, trade.minutes);
    }
  }
  const ranked = [...byLine.entries()].sort((a, b) => b[1] - a[1]);
  const line = ranked[0]?.[0] ?? 3;
  const lead = ranked[0] ?? ([3, 0] as const);
  const next = ranked[1] ?? ([5, 0] as const);
  const sum = lead[1] + next[1] || 1;
  const leftPct = Math.round((lead[1] / sum) * 100);
  return {
    multiple: market.entry / open,
    move: (market.entry - recent) / recent,
    volume,
    openInterest,
    ending,
    age: Number.parseInt(market.ago, 10) || 0,
    line,
    left: { line: lead[0], pct: leftPct },
    right: { line: next[0], pct: 100 - leftPct },
  };
}
