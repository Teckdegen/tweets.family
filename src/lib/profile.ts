import { sbCount, sbSelect } from "@/lib/supabase";
import { tokenBalance } from "@/lib/chain";
import type { Account, Profile, Stats, Trade, WalletEvent } from "@/lib/trades";

export async function loadAccount(xUserId: string) {
  const [account] = await sbSelect<Account>("accounts", {
    x_user_id: `eq.${xUserId}`,
    select:
      "x_user_id,username,display_name,avatar_url,banner_url,bio,followers_count,following_count,verified,wallet_address,created_at",
  });
  return account ?? null;
}

export async function loadProfile(xUserId: string): Promise<Profile | null> {
  const account = await loadAccount(xUserId);
  if (!account) return null;

  const [board, trades, events, balance] = await Promise.all([
    sbSelect<Omit<Stats, "rank">>("leaderboard", {
      x_user_id: `eq.${xUserId}`,
      select: "pnl,earned,trades,wins,biggest_win",
    }),
    sbSelect<Trade>("trades", {
      user_id: `eq.${xUserId}`,
      status: "not.in.(placing,rejected)",
      select: "mention_id,tweet_id,stake,fee,back,leverage,minutes,entry,target,final,status,opened_at,settled_at",
      order: "opened_at.desc",
      limit: "200",
    }),
    sbSelect<WalletEvent>("wallet_events", {
      x_user_id: `eq.${xUserId}`,
      select: "tx_hash,log_index,kind,amount,occurred_at",
      order: "occurred_at.desc",
      limit: "100",
    }).catch(() => []), // table missing until supabase.sql is re-run
    tokenBalance(account.wallet_address),
  ]);

  const row = board[0];
  const rank = row ? (await sbCount("leaderboard", { pnl: `gt.${row.pnl}`, select: "x_user_id" })) + 1 : null;

  return {
    account,
    balance,
    stats: {
      pnl: Number(row?.pnl) || 0,
      earned: Number(row?.earned) || 0,
      trades: Number(row?.trades) || 0,
      wins: Number(row?.wins) || 0,
      biggest_win: Number(row?.biggest_win) || 0,
      rank,
    },
    trades,
    events,
    now: Date.now(),
  };
}
