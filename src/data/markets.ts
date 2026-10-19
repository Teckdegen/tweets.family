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
  postedAt: number;
  entry: number;
  replies: number;
  reposts: number;
  likes: number;
  quotes: number;
  series: number[];
  trades: BookTrade[];
};

export function formatAgo(postedAt: number, now = Date.now()) {
  const seconds = Math.max(0, Math.floor(now / 1000) - postedAt);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  const days = Math.floor(seconds / 86400);
  if (days < 14) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
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
  postedAt: number,
  counts: { likes: number; replies: number; reposts: number; quotes: number },
  salt: number,
  topic: Topic,
  trades: BookTrade[],
  previousEntry: number,
  image?: string,
): Market {
  const entry = counts.likes + counts.replies + counts.reposts + counts.quotes;
  const scaled = trades.map((trade) => ({
    ...trade,
    entry: Math.max(1, Math.round((trade.entry / previousEntry) * entry)),
  }));
  return {
    id,
    influencerId,
    topic,
    text,
    image,
    postedAt,
    entry,
    ...counts,
    series: moved(entry, salt),
    trades: scaled,
  };
}

export const MARKETS: Market[] = [
  market(
    "cz-build",
    "cz",
    "Which other blockchain burns $1.1 billion worth of tokens each quarter?",
    1792413591,
    { likes: 1216, replies: 396, reposts: 122, quotes: 47 },
    1.2,
    "Crypto",
    [
      trade("cz-1", "2026-10-01T13:40:00Z", 250, 3, 15, 12100, "won"),
      trade("cz-2", "2026-10-01T14:05:00Z", 100, 5, 15, 16840, "lost"),
      trade("cz-3", "2026-10-01T15:10:00Z", 80, 4, 30, 17990, "open"),
      trade("cz-4", "2026-10-01T12:22:00Z", 40, 2, 5, 9800, "won"),
    ],
    18420,
  ),
  market(
    "vlad-simple",
    "vlad",
    "We took Robinhood public. Then we rebuilt it publicly.\nI wrote about this for @HarvardBiz:\n\nhttps://hbr.org/2026/11/robinhoods-ceo-on-refounding-the-business-post-ipo?giftToken=4309089161791913355139",
    1792189808,
    { likes: 1066, replies: 263, reposts: 50, quotes: 37 },
    2.1,
    "Markets",
    [
      trade("vlad-1", "2026-10-01T12:48:00Z", 60, 3, 15, 4100, "won"),
      trade("vlad-2", "2026-10-01T14:16:00Z", 150, 4, 30, 5880, "lost"),
      trade("vlad-3", "2026-10-01T15:28:00Z", 25, 5, 5, 6310, "open"),
      trade("vlad-4", "2026-10-01T11:05:00Z", 200, 3, 30, 2900, "won"),
    ],
    6420,
  ),
  market(
    "elon-curve",
    "elon",
    "Hire Grok @Bot today. You won’t regret it.",
    1792394965,
    { likes: 7320, replies: 1113, reposts: 717, quotes: 105 },
    0.4,
    "Tech",
    [
      trade("elon-1", "2026-10-01T14:52:00Z", 500, 3, 15, 98000, "won"),
      trade("elon-2", "2026-10-01T15:20:00Z", 1000, 5, 30, 121200, "lost"),
      trade("elon-3", "2026-10-01T15:48:00Z", 200, 4, 15, 126600, "open"),
      trade("elon-4", "2026-10-01T13:11:00Z", 75, 2, 5, 74000, "won"),
    ],
    128400,
  ),
  market(
    "ansem-fade",
    "ansem",
    "i've always viewed social awareness as one of the biggest edges in memecoin trading\n\nbeing early to viral trends matters, but understanding who's behind the attention and how committed the community is can be just as important\n\ni pay close attention to holder distribution, community activity and the social capital of people associated with a coin\n\nthose factors can help explain why certain memes sustain attention while thousands of others fade away",
    1792383716,
    { likes: 658, replies: 236, reposts: 76, quotes: 17 },
    3.3,
    "Crypto",
    [
      trade("ansem-1", "2026-10-01T14:33:00Z", 120, 5, 15, 16400, "won"),
      trade("ansem-2", "2026-10-01T15:02:00Z", 80, 3, 30, 20150, "lost"),
      trade("ansem-3", "2026-10-01T15:41:00Z", 50, 4, 5, 21880, "open"),
      trade("ansem-4", "2026-10-01T12:58:00Z", 300, 3, 15, 14220, "lost"),
    ],
    22110,
    "https://pbs.twimg.com/amplify_video_thumb/2112036366045634560/img/50K4v8exIz8Gt2Jm.jpg",
  ),
  market(
    "ozzy-ship",
    "ozzy",
    "Almost 50K wallets registered on the new pons web app.\n\nGoing to be doubling down on this 🙏",
    1792033754,
    { likes: 502, replies: 93, reposts: 31, quotes: 12 },
    4.2,
    "Crypto",
    [
      trade("ozzy-1", "2026-10-01T13:26:00Z", 40, 4, 15, 2100, "won"),
      trade("ozzy-2", "2026-10-01T14:44:00Z", 25, 3, 15, 2740, "lost"),
      trade("ozzy-3", "2026-10-01T15:36:00Z", 100, 5, 30, 3090, "open"),
      trade("ozzy-4", "2026-10-01T11:40:00Z", 15, 2, 5, 1600, "won"),
    ],
    3180,
    "https://pbs.twimg.com/media/HUo-oSRXcAANGxO.png?name=orig",
  ),
  market(
    "vitalik-online",
    "vitalik",
    "Ultimately, precompiles and EVM are both the wrong place to put most cryptography support into Ethereum. The reason is that precompiles and EVM both operate on data that has to be included into the ethereum chain somehow, which realistically means included in a block as calldata. That space is limited - even with PeerDAS and blocks-in-blobs, there's a practical cap of ~8 MB/s before it starts getting uncomfortable.\n\nRemember: it's not a blockchain. It's a cryptographic world computer. Any data/computation that does not need to be in the \"main thread\" of data/execution should not be put into the main thread.\n\nInstead, the correct solution is... EIP-8288 maximalism.\n\nIf you have any heavy computation that's self-contained, compute it and STARK it client-side (this is quickly getting faster and faster, even on phones), and push the STARK through the EIP-8288 recursive aggregation mechanism. The chain sees the fact that the computation was done and what the result is; it never needs to see the actual data and computation.\n\nThis way everyone can use whatever cryptography they want, the Ethereum chain can be lean, and we never need to add more precompiles again.",
    1792382645,
    { likes: 1255, replies: 246, reposts: 138, quotes: 65 },
    5.5,
    "Tech",
    [
      trade("vit-1", "2026-10-01T12:15:00Z", 90, 3, 30, 6200, "won"),
      trade("vit-2", "2026-10-01T14:08:00Z", 200, 5, 15, 8100, "lost"),
      trade("vit-3", "2026-10-01T15:22:00Z", 60, 4, 15, 9120, "open"),
      trade("vit-4", "2026-10-01T10:50:00Z", 35, 2, 5, 4400, "won"),
    ],
    9400,
  ),
  market(
    "brian-freedom",
    "brian",
    "The beauty of 24/7 markets is you can react to news at any time.\n\nWhen Elon announces flying cars, traders shouldn’t be stuck on the sidelines waiting for the markets to reopen. Perps and tokenized stocks fix this.",
    1792351998,
    { likes: 1002, replies: 183, reposts: 87, quotes: 16 },
    1.8,
    "Markets",
    [
      trade("brian-1", "2026-10-01T13:05:00Z", 180, 3, 15, 11200, "won"),
      trade("brian-2", "2026-10-01T14:29:00Z", 70, 4, 5, 14110, "lost"),
      trade("brian-3", "2026-10-01T15:33:00Z", 120, 5, 30, 15440, "open"),
      trade("brian-4", "2026-10-01T11:18:00Z", 45, 3, 30, 8600, "won"),
    ],
    15770,
  ),
  market(
    "mert-infra",
    "mert",
    "poverty is a mentality",
    1792152264,
    { likes: 1172, replies: 93, reposts: 26, quotes: 3 },
    2.7,
    "Infrastructure",
    [
      trade("mert-1", "2026-10-01T13:55:00Z", 150, 4, 15, 7900, "won"),
      trade("mert-2", "2026-10-01T14:47:00Z", 60, 5, 30, 10120, "lost"),
      trade("mert-3", "2026-10-01T15:44:00Z", 90, 3, 15, 11080, "open"),
      trade("mert-4", "2026-10-01T12:36:00Z", 20, 2, 5, 5400, "won"),
    ],
    11240,
    "https://pbs.twimg.com/media/HUwDEHYbgAAZ_sy.jpg?name=orig",
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
