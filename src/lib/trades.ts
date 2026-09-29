// Shared by server and client code: no imports that touch secrets or the network.

export type Account = {
  x_user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  followers_count: number | null;
  following_count: number | null;
  verified: boolean | null;
  wallet_address: string | null;
  created_at: string;
};

export type Trade = {
  mention_id: string;
  tweet_id: string;
  stake: number;
  fee: number;
  back: number;
  leverage: number;
  minutes: number;
  entry: number;
  target: number;
  final: number | null;
  status: string;
  opened_at: string;
  settled_at: string | null;
};

export type Stats = {
  pnl: number;
  earned: number;
  trades: number;
  wins: number;
  biggest_win: number;
  rank: number | null;
};

// a deposit into or withdrawal out of the user's deposit wallet (recorded by the bot)
export type WalletEvent = {
  tx_hash: string;
  log_index: number;
  kind: "deposit" | "withdrawal";
  amount: number;
  occurred_at: string;
};

export type Profile = {
  account: Account;
  balance: number | null;
  stats: Stats;
  trades: Trade[];
  events: WalletEvent[];
  // when the data was loaded; server and browser both draw the chart and "x ago" labels from it
  now: number;
};

// What the bet did to the user's wallet, counting the opening fee (matches the bot's leaderboard PNL).
export function tradePnl(trade: Pick<Trade, "status" | "stake" | "fee" | "back">) {
  const paid = Number(trade.stake) + Number(trade.fee);
  if (trade.status === "won") return Number(trade.back) - paid;
  if (trade.status === "lost") return -paid;
  if (trade.status === "void") return -Number(trade.fee);
  return 0;
}
