"use client";

import { useEffect, useMemo, useState } from "react";
import { money, signedMoney, timeAgo } from "@/components/profile/format";
import { TOKEN_SYMBOL } from "@/lib/token";
import { tradePnl, type Trade, type WalletEvent } from "@/lib/trades";

const BLUE = "#0050FD";
const DOWN = "#F04438";

function isOpen(trade: Trade) {
  return trade.status === "open" || trade.status === "settling";
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    won: "bg-[#0050FD]/10 text-[#0050FD]",
    lost: "bg-[#F04438]/10 text-[#F04438]",
    void: "bg-[#0b1020]/[0.06] text-[#5b6b8c]",
    open: "bg-[#0050FD] text-white",
    settling: "bg-[#0050FD] text-white",
  };
  return (
    <span
      className={`w-[58px] shrink-0 rounded-full py-1 text-center text-[12px] font-semibold capitalize ${styles[status] || styles.void}`}
    >
      {status === "settling" ? "open" : status}
    </span>
  );
}

function countdown(ms: number) {
  if (ms <= 0) return "settling…";
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds} left`;
}

function ActiveCard({ trade, clock }: { trade: Trade; clock: number }) {
  const opened = new Date(trade.opened_at).getTime();
  const ends = opened + trade.minutes * 60_000;
  const progress = Math.min(1, Math.max(0, (clock - opened) / (ends - opened)));
  return (
    <a
      href={`https://x.com/i/status/${trade.tweet_id}`}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[20px] bg-[#0050FD]/[0.05] p-4 transition hover:bg-[#0050FD]/[0.08]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <StatusPill status={trade.status} />
          <p className="text-[16px] font-bold">
            {trade.leverage}x · {trade.minutes}m
          </p>
        </div>
        <p className="text-[16px] font-bold text-[#0050FD]">pays {money(Number(trade.back))}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
        <div>
          <p className="text-[#8a97b3]">Staked</p>
          <p className="font-semibold">{money(Number(trade.stake))}</p>
        </div>
        <div>
          <p className="text-[#8a97b3]">Fee</p>
          <p className="font-semibold">{money(Number(trade.fee))}</p>
        </div>
        <div className="text-right">
          <p className="text-[#8a97b3]">Target</p>
          <p className="font-semibold">
            {Number(trade.target).toLocaleString("en-US")}
            <span className="font-normal text-[#8a97b3]"> / {Number(trade.entry).toLocaleString("en-US")}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0050FD]/10">
          <div className="h-full rounded-full bg-[#0050FD]" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="w-[86px] text-right text-[12px] font-semibold text-[#5b6b8c] tabular-nums">
          {countdown(ends - clock)}
        </span>
      </div>
    </a>
  );
}

function BetRow({ trade, now }: { trade: Trade; now: number }) {
  const open = isOpen(trade);
  const pnl = tradePnl(trade);
  return (
    <a
      href={`https://x.com/i/status/${trade.tweet_id}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-[18px] px-3 py-3 transition hover:bg-[#0050FD]/[0.05]"
    >
      <StatusPill status={trade.status} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">
          {trade.leverage}x · {trade.minutes}m
        </p>
        <p className="truncate text-[13px] text-[#5b6b8c]">
          {money(Number(trade.stake))} in · target {Number(trade.target).toLocaleString("en-US")}
          {trade.final !== null ? ` · ended ${Number(trade.final).toLocaleString("en-US")}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold" style={{ color: open || pnl >= 0 ? BLUE : DOWN }}>
          {open ? `pays ${money(Number(trade.back))}` : signedMoney(pnl)}
        </p>
        <p className="text-[12px] text-[#8a97b3]">{timeAgo(trade.opened_at, now)}</p>
      </div>
    </a>
  );
}

function FundingRow({ event, now }: { event: WalletEvent; now: number }) {
  const deposit = event.kind === "deposit";
  return (
    <div className="flex items-center gap-3 rounded-[18px] px-3 py-3">
      <span
        className={`grid h-[26px] w-[58px] shrink-0 place-items-center rounded-full ${
          deposit ? "bg-[#0050FD]/10 text-[#0050FD]" : "bg-[#0b1020]/[0.06] text-[#1c2640]"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            d={deposit ? "M12 5v14M6 13l6 6 6-6" : "M12 19V5M6 11l6-6 6 6"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{deposit ? "Deposit" : "Withdrawal"}</p>
        <p className="truncate text-[13px] text-[#5b6b8c]">{TOKEN_SYMBOL} · Robinhood Chain</p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold" style={{ color: deposit ? BLUE : "#1c2640" }}>
          {deposit ? "+" : "-"}
          {money(Number(event.amount))}
        </p>
        <p className="text-[12px] text-[#8a97b3]">{timeAgo(event.occurred_at, now)}</p>
      </div>
    </div>
  );
}

type Tab = "active" | "history";

export default function Activity({ trades, events, now }: { trades: Trade[]; events: WalletEvent[]; now: number }) {
  const active = useMemo(() => trades.filter(isOpen), [trades]);
  const [tab, setTab] = useState<Tab>(active.length ? "active" : "history");
  const [clock, setClock] = useState(now);

  // tick the countdowns while the Active tab is showing
  useEffect(() => {
    if (tab !== "active" || !active.length) return;
    const started = Date.now();
    const timer = window.setInterval(() => setClock(now + (Date.now() - started)), 1000);
    return () => window.clearInterval(timer);
  }, [tab, active.length, now]);

  // every bet ever opened plus deposits and withdrawals, newest first
  const history = useMemo(
    () =>
      [
        ...trades.map((trade) => ({ at: trade.opened_at, key: `t-${trade.mention_id}`, trade })),
        ...events.map((event) => ({ at: event.occurred_at, key: `e-${event.tx_hash}-${event.log_index}-${event.kind}`, event })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [trades, events],
  );

  return (
    <section className="mt-6">
      <div className="flex rounded-full bg-[#0050FD]/[0.07] p-1">
        {(
          [
            ["active", `Active${active.length ? ` · ${active.length}` : ""}`],
            ["history", "History"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-10 flex-1 rounded-full text-[15px] font-semibold transition ${
              tab === key ? "bg-white text-[#0050FD] shadow-[0_2px_8px_rgba(0,80,253,0.15)]" : "text-[#8a97b3] hover:text-[#0050FD]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "active" ? (
          active.length ? (
            <div className="flex flex-col gap-3">
              {active.map((trade) => (
                <ActiveCard key={trade.mention_id} trade={trade} clock={clock} />
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[#0050FD]/25 px-5 py-6 text-center">
              <p className="text-[15px] font-semibold">No active bets</p>
              <p className="mt-1 text-[14px] text-[#5b6b8c]">
                Reply under a post with <span className="font-mono text-[#0050FD]">@tweetscc 10 3x 15m</span>
              </p>
            </div>
          )
        ) : history.length ? (
          <div className="-mx-3 flex flex-col">
            {history.map((item) =>
              "trade" in item && item.trade ? (
                <BetRow key={item.key} trade={item.trade} now={now} />
              ) : "event" in item && item.event ? (
                <FundingRow key={item.key} event={item.event} now={now} />
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#0050FD]/25 px-5 py-6 text-center">
            <p className="text-[15px] font-semibold">Nothing here yet</p>
            <p className="mt-1 text-[14px] text-[#5b6b8c]">Your bets, deposits and withdrawals will show up here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
