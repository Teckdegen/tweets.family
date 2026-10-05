"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Influencer } from "@/data/influencers";
import type { BookTrade, Market } from "@/data/markets";
import TradeTicket from "@/components/markets/TradeTicket";
import { lineAtMinute } from "@/lib/quote";

export default function TradeModal({
  market,
  person,
  minutes,
  onMinutes,
  onClose,
}: {
  market: Market;
  person: Influencer;
  minutes: number;
  onMinutes: (minutes: number) => void;
  onClose: () => void;
}) {
  const [trades, setTrades] = useState<BookTrade[]>(market.trades);
  const [mounted, setMounted] = useState(false);
  const openOnPost = trades.filter((trade) => trade.status === "open").length;
  const line = lineAtMinute(minutes);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`trade-${market.id}`}
        onClick={(event) => event.stopPropagation()}
        className="trade-sheet flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#121214] text-white shadow-[0_-24px_80px_rgba(0,0,0,0.45)] sm:max-w-[440px] sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start gap-3 px-5 pt-4 pb-3">
          <Image
            src={person.avatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id={`trade-${market.id}`} className="truncate text-[15px] font-semibold">
                {person.name}
              </h2>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70 tabular-nums">
                {minutes}m · {line}x
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/55">{market.text}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-6">
          <TradeTicket
            market={market}
            minutes={minutes}
            onMinutes={onMinutes}
            openOnPost={openOnPost}
            onOpen={(trade) => setTrades((current) => [trade, ...current])}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
