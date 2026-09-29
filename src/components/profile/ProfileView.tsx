"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import XLogo from "@/components/XLogo";
import FundModal from "@/components/profile/FundModal";
import Activity from "@/components/profile/Activity";
import { compact, moneyParts, shortAddress, signedMoney } from "@/components/profile/format";
import { monotonePath } from "@/lib/chart";
import { TOKEN_SYMBOL } from "@/lib/token";
import { tradePnl, type Profile, type Trade } from "@/lib/trades";

const WINDOWS = [
  { key: "24h", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "All", ms: Infinity },
] as const;
type WindowKey = (typeof WINDOWS)[number]["key"];

// brand: the logo's blue on white
const BLUE = "#0050FD";
const DOWN = "#F04438";

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0" aria-label="Verified">
      <path
        fill={BLUE}
        d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.46-1.4.2-3-.87-4.07s-2.67-1.33-4.07-.87C14.68 2.61 13.31 1.73 11.73 1.73S8.78 2.6 8.08 3.9c-1.4-.46-3-.2-4.07.87S2.68 7.45 3.14 8.85C1.84 9.55.96 10.92.96 12.5s.88 2.95 2.18 3.65c-.46 1.4-.2 3 .87 4.07s2.67 1.33 4.07.87c.7 1.3 2.07 2.18 3.65 2.18s2.95-.88 3.65-2.18c1.4.46 3 .2 4.07-.87s1.33-2.67.87-4.07c1.3-.7 2.18-2.07 2.18-3.65z"
      />
      <path d="M8 12.5l2.6 2.6L16 9.7" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// cumulative PNL of bets settled inside the window, starting from 0 at the window's start
function pnlSeries(trades: Trade[], windowMs: number, now: number) {
  const settled = trades
    .filter((trade) => trade.settled_at && ["won", "lost", "void"].includes(trade.status))
    .map((trade) => ({ at: new Date(trade.settled_at as string).getTime(), pnl: tradePnl(trade) }))
    .filter((point) => now - point.at <= windowMs)
    .sort((a, b) => a.at - b.at);
  const start = Number.isFinite(windowMs) ? now - windowMs : (settled[0]?.at ?? now) - 60_000;
  const points: { at: number; value: number }[] = [{ at: start, value: 0 }];
  let total = 0;
  for (const point of settled) {
    total += point.pnl;
    points.push({ at: point.at, value: total });
  }
  points.push({ at: now, value: total });
  return { points, change: total };
}

function PnlChart({ points, color }: { points: { at: number; value: number }[]; color: string }) {
  const W = 600;
  const H = 190;
  const pad = 14;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const t0 = points[0].at;
  const t1 = points[points.length - 1].at;
  // a flat line (no settled bets in the window) sits in the middle
  const y = (value: number) => (max === min ? H / 2 : pad + (1 - (value - min) / (max - min)) * (H - pad * 2));
  const xy = points.map(
    (point) => [pad + ((point.at - t0) / (t1 - t0 || 1)) * (W - pad * 2), y(point.value)] as [number, number],
  );
  const line = monotonePath(xy);
  const last = xy[xy.length - 1];
  const area = `${line} L ${last[0].toFixed(1)} ${H} L ${xy[0][0].toFixed(1)} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="pnl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <pattern id="pnl-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="rgba(0,80,253,0.08)" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#pnl-dots)" />
      <path d={area} fill="url(#pnl-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="11" fill={color} opacity="0.18" />
      <circle cx={last[0]} cy={last[1]} r="5.5" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
}

export default function ProfileView({ profile }: { profile: Profile }) {
  const { account, stats, trades, now } = profile;
  const [windowKey, setWindowKey] = useState<WindowKey>("24h");
  const [fundOpen, setFundOpen] = useState(false);
  const [balance, setBalance] = useState(profile.balance);
  const closeFund = useCallback(() => setFundOpen(false), []);

  const windowMs = WINDOWS.find((item) => item.key === windowKey)!.ms;
  const series = useMemo(() => pnlSeries(trades, windowMs, now), [trades, windowMs, now]);
  const color = series.change < 0 ? DOWN : BLUE;
  const pnl = moneyParts(stats.pnl);
  const cash = balance === null ? null : moneyParts(balance);
  const winRate = stats.trades ? Math.round((stats.wins / stats.trades) * 100) : 0;
  const name = account.display_name || account.username;

  return (
    <main className="min-h-screen bg-white text-[#0b1020]">
      <div className="mx-auto w-full max-w-[600px] pb-16">
        {/* banner + top bar */}
        <div className="relative h-[170px] w-full overflow-hidden bg-[#0050FD] sm:h-[200px] sm:rounded-b-[28px]">
          {account.banner_url ? (
            <Image src={account.banner_url} alt="" fill priority className="object-cover" sizes="600px" />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_85%_10%,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_60%)]" />
              <Image
                src="/logo.png"
                alt=""
                width={220}
                height={220}
                className="absolute top-1/2 left-1/2 w-[200px] -translate-x-1/2 -translate-y-1/2 opacity-25"
              />
            </>
          )}
        </div>

        <div className="px-4 sm:px-6">
          {/* avatar row with actions */}
          {/* avatar and buttons are centred on the banner's bottom edge, half in and half out */}
          <div className="relative z-10 -mt-12 flex items-center justify-between">
            <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-[#0050FD] ring-4 ring-white">
              {account.avatar_url ? (
                <Image src={account.avatar_url} alt={name} fill className="object-cover" sizes="96px" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[36px] font-bold text-white">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={`https://x.com/${account.username}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`@${account.username} on X`}
                className="grid h-11 w-11 place-items-center rounded-[14px] bg-white text-[#0050FD] shadow-[0_8px_22px_rgba(0,40,140,0.18)] transition hover:bg-[#f2f6ff]"
              >
                <XLogo className="h-[18px] w-[18px]" />
              </a>
              <button
                type="button"
                onClick={() => setFundOpen(true)}
                className="h-11 rounded-[14px] bg-[#0050FD] px-8 text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(0,40,140,0.3)] ring-4 ring-white transition hover:bg-[#1a63ff] active:scale-[0.98]"
              >
                Fund
              </button>
            </div>
          </div>

          {/* identity */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[26px] font-bold tracking-[-0.02em]">{name}</h1>
              {account.verified ? <VerifiedBadge /> : null}
            </div>
            <p className="text-[16px] text-[#5b6b8c]">@{account.username}</p>
            {account.bio ? (
              <p className="mt-3 text-[16px] leading-snug whitespace-pre-line text-[#1c2640]">{account.bio}</p>
            ) : null}
            <div className="mt-3 flex gap-5 text-[15px]">
              <p>
                <span className="font-bold">{compact(account.following_count ?? 0)}</span>{" "}
                <span className="text-[#5b6b8c]">Following</span>
              </p>
              <p>
                <span className="font-bold">{compact(account.followers_count ?? 0)}</span>{" "}
                <span className="text-[#5b6b8c]">Followers</span>
              </p>
            </div>
          </div>

          {/* chips */}
          <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-1 text-[14px] whitespace-nowrap text-[#5b6b8c] [scrollbar-width:none] sm:-mx-6 sm:px-6">
            {stats.rank && stats.trades ? (
              <span className="flex items-center gap-1.5 font-semibold text-[#0050FD]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="currentColor" d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.9 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z" />
                </svg>
                {stats.rank <= 100 ? `Top 100 · #${stats.rank}` : `#${stats.rank}`}
              </span>
            ) : null}
            <span>{winRate}% win rate</span>
            <span>{stats.trades.toLocaleString("en-US")} bets</span>
          </div>

          {/* PNL */}
          <section className="mt-6 border-t border-[#0050FD]/10 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#5b6b8c]">Total PNL</p>
                <p className="text-[38px] leading-tight font-bold tracking-[-0.03em]">
                  {pnl.whole}
                  <span className="text-[#a3b0cc]">{pnl.cents}</span>
                </p>
                <p className="text-[16px] font-semibold" style={{ color }}>
                  {signedMoney(series.change)}{" "}
                  <span className="text-[#8a97b3]">{windowKey === "All" ? "all time" : windowKey}</span>
                </p>
              </div>
              <div className="flex rounded-full bg-[#0050FD]/[0.07] p-1">
                {WINDOWS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWindowKey(item.key)}
                    className={`rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition sm:px-3 ${
                      windowKey === item.key
                        ? "bg-white text-[#0050FD] shadow-[0_2px_8px_rgba(0,80,253,0.15)]"
                        : "text-[#8a97b3] hover:text-[#0050FD]"
                    }`}
                  >
                    {item.key}
                  </button>
                ))}
              </div>
            </div>
            <div className="-mx-4 mt-3 sm:-mx-6">
              <PnlChart points={series.points} color={color} />
            </div>
          </section>

          {/* cash */}
          <section className="mt-4 flex items-center gap-4 rounded-[24px] bg-[#0050FD] p-4 text-white shadow-[0_16px_40px_rgba(0,80,253,0.28)]">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 text-[24px] font-bold">
              $
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-white/75">Total cash</p>
              <p className="text-[26px] font-bold tracking-[-0.02em]">
                {cash ? (
                  <>
                    {cash.whole}
                    <span className="text-white/55">{cash.cents}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
              <p className="truncate text-[12px] text-white/65">
                {account.wallet_address
                  ? `${TOKEN_SYMBOL} · ${shortAddress(account.wallet_address)}`
                  : "Wallet setting up…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFundOpen(true)}
              className="h-10 shrink-0 rounded-full bg-white px-4 text-[14px] font-semibold text-[#0050FD] transition hover:bg-white/90"
            >
              Add funds
            </button>
          </section>

          <Activity trades={trades} events={profile.events} now={now} />
        </div>
      </div>

      <FundModal
        open={fundOpen}
        onClose={closeFund}
        initialAddress={account.wallet_address}
        initialBalance={balance}
        onBalance={setBalance}
      />
    </main>
  );
}
