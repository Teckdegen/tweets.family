import type { Line } from "@/lib/quote";
import { lineAllowed } from "@/lib/quote";

export type BookTrade = {
  id: string;
  openedAt: string;
  amount: number;
  line: Line;
  minutes: number;
  entry: number;
  status: "open" | "won" | "lost";
  // set when the desk opens a trade; sample rows use the 5% house fee
  feeRate?: number;
};

export const TOPICS = ["Crypto", "Markets", "Tech", "Infrastructure"] as const;
export type Topic = (typeof TOPICS)[number];

export type Market = {
  id: string;
  influencerId: string;
  topic: Topic;
  text: string;
  image?: string;
  ago: string;
  entry: number;
  replies: number;
  reposts: number;
  likes: number;
  quotes: number;
  series: number[];
  trades: BookTrade[];
};

function parts(total: number) {
  const replies = Math.round(total * 0.14);
  const reposts = Math.round(total * 0.18);
  const quotes = Math.round(total * 0.06);
  const likes = total - replies - reposts - quotes;
  return { replies, reposts, likes, quotes };
}

function moved(end: number, salt: number) {
  const start = Math.round(end * 0.36);
  const n = 32;
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const eased = t * t * (3 - 2 * t);
    const base = start + (end - start) * eased;
    const wave = Math.sin(i * 0.9 + salt) * end * 0.03;
    values.push(Math.max(1, Math.round(base + wave)));
  }
  values[n - 1] = end;
  return values;
}

function trade(
  id: string,
  openedAt: string,
  amount: number,
  line: Line,
  minutes: number,
  entry: number,
  status: BookTrade["status"],
): BookTrade {
  if (!lineAllowed(line, minutes)) throw new Error(`illegal line ${id}`);
  return { id, openedAt, amount, line, minutes, entry, status };
}

function market(
  id: string,
  influencerId: string,
  text: string,
  ago: string,
  entry: number,
  salt: number,
  topic: Topic,
  trades: BookTrade[],
): Market {
  return { id, influencerId, topic, text, ago, entry, ...parts(entry), series: moved(entry, salt), trades };
}

export const MARKETS: Market[] = [
  market(
    "cz-build",
    "cz",
    "Keep building. The rest is noise.",
    "14m",
    18420,
    1.2,
    "Crypto",
    [
      trade("cz-1", "2026-10-01T13:40:00Z", 250, 3, 15, 12100, "won"),
      trade("cz-2", "2026-10-01T14:05:00Z", 100, 5, 15, 16840, "lost"),
      trade("cz-3", "2026-10-01T15:10:00Z", 80, 4, 30, 17990, "open"),
      trade("cz-4", "2026-10-01T12:22:00Z", 40, 2, 5, 9800, "won"),
    ],
  ),
  market(
    "vlad-simple",
    "vlad",
    "Markets should feel as simple as sending a message.",
    "31m",
    6420,
    2.1,
    "Markets",
    [
      trade("vlad-1", "2026-10-01T12:48:00Z", 60, 3, 15, 4100, "won"),
      trade("vlad-2", "2026-10-01T14:16:00Z", 150, 4, 30, 5880, "lost"),
      trade("vlad-3", "2026-10-01T15:28:00Z", 25, 5, 5, 6310, "open"),
      trade("vlad-4", "2026-10-01T11:05:00Z", 200, 3, 30, 2900, "won"),
    ],
  ),
  market(
    "elon-curve",
    "elon",
    "The next step is obvious once you see the curve.",
    "6m",
    128400,
    0.4,
    "Tech",
    [
      trade("elon-1", "2026-10-01T14:52:00Z", 500, 3, 15, 98000, "won"),
      trade("elon-2", "2026-10-01T15:20:00Z", 1000, 5, 30, 121200, "lost"),
      trade("elon-3", "2026-10-01T15:48:00Z", 200, 4, 15, 126600, "open"),
      trade("elon-4", "2026-10-01T13:11:00Z", 75, 2, 5, 74000, "won"),
    ],
  ),
  market(
    "ansem-fade",
    "ansem",
    "this is the part of the chart people fade and then quote a week later",
    "9m",
    22110,
    3.3,
    "Crypto",
    [
      trade("ansem-1", "2026-10-01T14:33:00Z", 120, 5, 15, 16400, "won"),
      trade("ansem-2", "2026-10-01T15:02:00Z", 80, 3, 30, 20150, "lost"),
      trade("ansem-3", "2026-10-01T15:41:00Z", 50, 4, 5, 21880, "open"),
      trade("ansem-4", "2026-10-01T12:58:00Z", 300, 3, 15, 14220, "lost"),
    ],
  ),
  market(
    "ozzy-ship",
    "ozzy",
    "You are not bullish enough on people who just ship.",
    "18m",
    3180,
    4.2,
    "Crypto",
    [
      trade("ozzy-1", "2026-10-01T13:26:00Z", 40, 4, 15, 2100, "won"),
      trade("ozzy-2", "2026-10-01T14:44:00Z", 25, 3, 15, 2740, "lost"),
      trade("ozzy-3", "2026-10-01T15:36:00Z", 100, 5, 30, 3090, "open"),
      trade("ozzy-4", "2026-10-01T11:40:00Z", 15, 2, 5, 1600, "won"),
    ],
  ),
  market(
    "vitalik-online",
    "vitalik",
    "A system that only works when everyone is maximally online is not a system.",
    "42m",
    9400,
    5.5,
    "Tech",
    [
      trade("vit-1", "2026-10-01T12:15:00Z", 90, 3, 30, 6200, "won"),
      trade("vit-2", "2026-10-01T14:08:00Z", 200, 5, 15, 8100, "lost"),
      trade("vit-3", "2026-10-01T15:22:00Z", 60, 4, 15, 9120, "open"),
      trade("vit-4", "2026-10-01T10:50:00Z", 35, 2, 5, 4400, "won"),
    ],
  ),
  market(
    "brian-freedom",
    "brian",
    "More economic freedom means more people can just build.",
    "27m",
    15770,
    1.8,
    "Markets",
    [
      trade("brian-1", "2026-10-01T13:05:00Z", 180, 3, 15, 11200, "won"),
      trade("brian-2", "2026-10-01T14:29:00Z", 70, 4, 5, 14110, "lost"),
      trade("brian-3", "2026-10-01T15:33:00Z", 120, 5, 30, 15440, "open"),
      trade("brian-4", "2026-10-01T11:18:00Z", 45, 3, 30, 8600, "won"),
    ],
  ),
  market(
    "mert-infra",
    "mert",
    "if your rpc falls over the moment the chain gets fun, it was never infrastructure",
    "11m",
    11240,
    2.7,
    "Infrastructure",
    [
      trade("mert-1", "2026-10-01T13:55:00Z", 150, 4, 15, 7900, "won"),
      trade("mert-2", "2026-10-01T14:47:00Z", 60, 5, 30, 10120, "lost"),
      trade("mert-3", "2026-10-01T15:44:00Z", 90, 3, 15, 11080, "open"),
      trade("mert-4", "2026-10-01T12:36:00Z", 20, 2, 5, 5400, "won"),
    ],
  ),
];

export function viewBase(market: Market) {
  return Math.round(market.entry * 13.6 + market.reposts * 4);
}

export function marketById(id: string) {
  return MARKETS.find((market) => market.id === id) ?? null;
}

export function marketsFor(influencerId: string) {
  return MARKETS.filter((market) => market.influencerId === influencerId);
}
