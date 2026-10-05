"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { BookTrade, Market } from "@/data/markets";
import MinuteSlider from "@/components/markets/MinuteSlider";
import {
  LINES,
  MAX_MINUTES,
  MAX_STAKE,
  MIN_MINUTES,
  crowdFeeRate,
  formatPct,
  formatUsdg,
  lineAllowed,
  lineAtMinute,
  minuteForLine,
  openingFeeRate,
  quoteTrade,
  riskFeeRate,
} from "@/lib/quote";

export default function TradeTicket({
  market,
  minutes,
  onMinutes,
  openOnPost,
  onOpen,
}: {
  market: Market;
  minutes: number;
  onMinutes: (minutes: number) => void;
  openOnPost: number;
  onOpen?: (trade: BookTrade) => void;
}) {
  const [amount, setAmount] = useState("100");
  const [notice, setNotice] = useState<string | null>(null);

  const line = lineAtMinute(minutes);
  const feeRate = openingFeeRate(openOnPost);
  const collateral = Number(amount);
  const collateralOk = Number.isFinite(collateral) && collateral > 0 && collateral <= MAX_STAKE;
  const allowed = lineAllowed(line, minutes);
  const quote = collateralOk && allowed ? quoteTrade(collateral, minutes, line, feeRate) : null;
  const pays = quote != null && quote.back > collateral;
  const target = market.entry * line;
  const clock = Math.max(minutes, 0);

  const blockReason = useMemo(() => {
    if (!Number.isFinite(collateral) || collateral <= 0) return "Enter a collateral amount.";
    if (collateral > MAX_STAKE) return `Max stake is ${MAX_STAKE.toLocaleString("en-US")} USDG.`;
    if (!allowed) return `Duration runs from ${MIN_MINUTES} to ${MAX_MINUTES} minutes.`;
    if (quote && quote.back <= collateral) {
      return "A win would pay less than you put in. Shorten the clock or take a higher line.";
    }
    return null;
  }, [allowed, collateral, quote]);

  function openTrade() {
    if (!quote || !pays) return;
    const opened: BookTrade = {
      id: `desk-${Date.now()}`,
      openedAt: new Date().toISOString(),
      amount: collateral,
      line,
      minutes,
      entry: market.entry,
      status: "open",
      feeRate,
    };
    onOpen?.(opened);
    setNotice(`Opened. Pays ${formatUsdg(quote.back)} USDG if it hits ${target.toLocaleString("en-US")} in ${minutes}m.`);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-white/70">Duration</p>
        <p className="text-[15px] font-semibold text-white tabular-nums">{clock}m</p>
      </div>
      <div className="mt-2">
        <MinuteSlider
          minutes={minutes}
          onChange={(next) => {
            onMinutes(next);
            setNotice(null);
          }}
        />
      </div>

      <p className="mt-4 text-[13px] font-medium text-white/70">Line</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {LINES.map((option) => {
          const active = option === line;
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (option !== line) onMinutes(minuteForLine(option));
                setNotice(null);
              }}
              className={`h-11 rounded-xl text-[15px] font-bold tabular-nums transition ${
                active
                  ? "bg-[#3dffb0] text-[#062117] shadow-[0_6px_16px_rgba(61,255,176,0.22)]"
                  : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option}x
            </button>
          );
        })}
      </div>

      <label className="mt-5 block text-[13px] font-medium text-white/70" htmlFor={`collateral-${market.id}`}>
        Collateral
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 focus-within:border-[#3dffb0]/70">
        <Image src="/usdg.png" alt="" width={28} height={28} className="h-7 w-7" />
        <input
          id={`collateral-${market.id}`}
          inputMode="decimal"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value.replace(/[^0-9.]/g, ""));
            setNotice(null);
          }}
          className="h-12 w-full bg-transparent text-[20px] font-semibold text-white tabular-nums outline-none"
        />
        <span className="text-[13px] font-semibold text-white/50">USDG</span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {[25, 100, 250, 1000].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(String(preset));
              setNotice(null);
            }}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/70 hover:bg-white/15"
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-white/45 uppercase">Estimated payout</p>
        <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums">
          {quote ? formatUsdg(quote.back) : "—"}
          <span className="ml-2 text-[13px] font-semibold text-white/45">USDG</span>
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/55">
          If it hits {target.toLocaleString("en-US")} within {allowed ? minutes : "—"}m at {line}x.
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-[14px]">
        <Row label="Fee" value={quote ? `${formatUsdg(quote.fee)} · ${formatPct(feeRate)}` : "—"} />
        <Row label="Stake" value={quote ? formatUsdg(quote.stake) : "—"} />
        <Row label="Target" value={target.toLocaleString("en-US")} />
        <Row label="Profit if hit" value={quote ? `${formatUsdg(quote.back - collateral)} USDG` : "—"} strong />
      </dl>
      <p className="mt-3 text-[12px] leading-relaxed text-white/40">
        {formatPct(riskFeeRate(0))} house fee while utilization is under 30%
        {openOnPost > 0
          ? `, plus ${formatPct(crowdFeeRate(openOnPost))} from ${openOnPost} open ${openOnPost === 1 ? "bet" : "bets"}`
          : ""}
        . Payout = stake × (1 + (60 ÷ minutes) × (line − 1) × 0.05).
      </p>

      {blockReason && amount !== "" ? <p className="mt-3 text-[13px] text-[#ff8fa3]">{blockReason}</p> : null}
      {notice ? <p className="mt-3 text-[13px] font-medium text-[#3dffb0]">{notice}</p> : null}

      <button
        type="button"
        disabled={!pays}
        onClick={openTrade}
        className="mt-4 h-12 w-full rounded-full bg-white text-[15px] font-semibold text-[#070d16] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
      >
        Open trade
      </button>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-white/50">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-white" : "text-white/85"}`}>{value}</dd>
    </div>
  );
}
