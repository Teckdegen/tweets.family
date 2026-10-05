"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Influencer } from "@/data/influencers";
import type { BookTrade, Market } from "@/data/markets";
import EngagementChart from "@/components/markets/EngagementChart";
import TradeHistory from "@/components/markets/TradeHistory";
import TradeTicket from "@/components/markets/TradeTicket";
import { lineAtMinute } from "@/lib/quote";

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function MarketView({
  market,
  person,
  initialMinutes = 30,
}: {
  market: Market;
  person: Influencer;
  initialMinutes?: number;
}) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [trades, setTrades] = useState<BookTrade[]>(market.trades);

  const line = lineAtMinute(minutes);
  const openOnPost = trades.filter((trade) => trade.status === "open").length;
  const target = market.entry * line;

  return (
    <div className="min-h-screen bg-[#070d16] text-white">
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-24 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <div>
          <Link href="/markets" className="text-[13px] font-semibold text-[#7eb6ff]">
            Markets
          </Link>
          <article className="mt-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <Image
                src={person.avatar}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[15px] font-semibold">{person.name}</p>
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#2F6BFF] text-[9px] text-white">
                    ✓
                  </span>
                </div>
                <p className="text-[13px] text-white/50">
                  @{person.handle} · {market.ago}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[18px] leading-snug tracking-[-0.02em]">{market.text}</p>
            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/50">
              <div>
                <dt className="sr-only">Replies</dt>
                <dd>{compact(market.replies)} replies</dd>
              </div>
              <div>
                <dt className="sr-only">Reposts</dt>
                <dd>{compact(market.reposts)} reposts</dd>
              </div>
              <div>
                <dt className="sr-only">Likes</dt>
                <dd>{compact(market.likes)} likes</dd>
              </div>
              <div>
                <dt className="sr-only">Quotes</dt>
                <dd>{compact(market.quotes)} quotes</dd>
              </div>
            </dl>
          </article>
        </div>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.04] px-3 pt-4 pb-2 sm:px-5">
          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.02em]">Engagement</h2>
              <p className="mt-0.5 text-[13px] text-white/50">Likes + reposts + replies + quotes</p>
            </div>
            <p className="text-right">
              <span className="block text-[22px] font-semibold tracking-tight tabular-nums">
                {market.entry.toLocaleString("en-US")}
              </span>
              <span className="text-[12px] text-white/50">now</span>
            </p>
          </div>
          <EngagementChart series={market.series} target={target} line={line} />
        </section>

        <TradeHistory trades={trades} />
      </div>

      <aside className="h-fit rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-24">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-white/40 uppercase">Trade</p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">Open a position</h2>
        <div className="mt-5">
          <TradeTicket
            market={market}
            minutes={minutes}
            onMinutes={setMinutes}
            openOnPost={openOnPost}
            onOpen={(trade) => setTrades((current) => [trade, ...current])}
          />
        </div>
      </aside>
    </div>
    </div>
  );
}

