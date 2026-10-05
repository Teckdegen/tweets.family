"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Influencer } from "@/data/influencers";
import { TOPICS, viewBase, type Market } from "@/data/markets";
import type { BoardStats } from "@/lib/board";
import MinuteSlider from "@/components/markets/MinuteSlider";
import TradeModal from "@/components/markets/TradeModal";
import { lineAtMinute } from "@/lib/quote";

type Row = { market: Market; person: Influencer; stats: BoardStats };

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "volume", label: "Volume" },
  { id: "trending", label: "Trending" },
  { id: "ending", label: "Ending" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function score(row: Row) {
  return row.stats.volume * (1 + Math.abs(row.stats.move));
}

function rank(rows: Row[], sort: SortId) {
  const copy = [...rows];
  if (sort === "newest") return copy.sort((a, b) => a.stats.age - b.stats.age);
  if (sort === "volume") return copy.sort((a, b) => b.stats.volume - a.stats.volume);
  if (sort === "trending") return copy.sort((a, b) => Math.abs(b.stats.move) - Math.abs(a.stats.move));
  if (sort === "ending") return copy.sort((a, b) => (a.stats.ending ?? 999) - (b.stats.ending ?? 999));
  return copy.sort((a, b) => score(b) - score(a));
}

export default function MarketsBoard({
  rows,
  query,
  focusId,
}: {
  rows: Row[];
  query: string;
  focusId: string | null;
}) {
  const [topic, setTopic] = useState<string>("Trending");
  const [sort, setSort] = useState<SortId>("featured");
  const [status, setStatus] = useState<"open" | "all">("open");
  const [statusOpen, setStatusOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const personHit =
        !q ||
        row.person.name.toLowerCase().includes(q) ||
        row.person.handle.toLowerCase().includes(q);
      const topicHit = topic === "Trending" || row.market.topic === topic;
      const focusHit = !focusId || row.person.id === focusId;
      const openHit = status === "all" || row.stats.openInterest > 0;
      return personHit && topicHit && focusHit && openHit;
    });
  }, [rows, query, topic, focusId, status]);

  const ordered = rank(visible, sort);

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="no-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden border-b border-white/10">
        {["Trending", ...TOPICS].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTopic(item)}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-[14px] font-semibold ${
              topic === item ? "border-[#3d7eff] text-white" : "border-transparent text-white/45 hover:text-white/75"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {SORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSort(item.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${
              sort === item.id
                ? "bg-white text-[#111]"
                : "border border-white/15 text-white/80 hover:bg-white/5"
            }`}
          >
            <SortIcon id={item.id} />
            {item.label}
          </button>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((value) => !value)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-[13px] font-semibold text-white/80 hover:bg-white/5"
          >
            {status === "open" ? "Open" : "All"}
            <Chevron />
          </button>
          {statusOpen ? (
            <div className="absolute right-0 z-10 mt-2 w-28 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1d] py-1 shadow-xl">
              {(["open", "all"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStatus(item);
                    setStatusOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-white/80 hover:bg-white/5"
                >
                  {item === "open" ? "Open" : "All"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-white/45">No influencers match that search.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {ordered.map((row, index) => (
            <li key={row.market.id}>
              <MarketCard row={row} spotlight={sort === "featured" && index === 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarketCard({ row, spotlight }: { row: Row; spotlight: boolean }) {
  const { market, person, stats } = row;
  const cover = market.image ?? person.avatar;
  const [minutes, setMinutes] = useState(30);
  const [trading, setTrading] = useState(false);
  const line = lineAtMinute(minutes);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#101012] transition duration-200 ease-out hover:scale-[1.025] hover:border-white/40">
      <Link href={`/markets/${market.id}`} className="block transition hover:bg-white/[0.02]">
        <div className="relative h-[148px] bg-[#1a1a1e]">
          <Image src={cover} alt="" fill className="object-cover" sizes="380px" />
          {spotlight ? (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3dffb0]" />
              Spotlight
            </span>
          ) : null}
        </div>
        <div className="flex items-start gap-3 px-4 pt-3.5">
          <Image
            src={person.avatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-[16px] leading-[1.25] font-bold tracking-[-0.02em] text-white">
              {market.text}
            </p>
            <p className="mt-1 text-[13px] font-medium text-white/50">@{person.handle}</p>
          </div>
        </div>
      </Link>
      <div className="mt-3 flex items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <MinuteSlider minutes={minutes} onChange={(next) => setMinutes(next)} />
        </div>
        <button
          type="button"
          onClick={() => setTrading(true)}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#1a6b52] bg-[#0c241c] px-3 text-[#3dffb0] transition hover:border-[#3dffb0] hover:bg-[#102e24]"
        >
          <span className="text-[15px] leading-none font-bold tabular-nums">{line}x</span>
        </button>
      </div>
      <div className="mt-3 flex items-center px-4 pb-4 text-[13px] text-[#8b8b93]">
        <LiveViews base={viewBase(market)} />
        <span className="ml-auto tabular-nums">{compact(stats.volume)} Vol.</span>
        <span className="mx-2 text-white/20">|</span>
        <span>{market.ago}</span>
      </div>
      {trading ? (
        <TradeModal
          market={market}
          person={person}
          minutes={minutes}
          onMinutes={setMinutes}
          onClose={() => setTrading(false)}
        />
      ) : null}
    </article>
  );
}

function LiveViews({ base }: { base: number }) {
  const [views, setViews] = useState(base);

  useEffect(() => {
    const step = viewsStep(base);
    const id = window.setInterval(() => {
      setViews((current) => current + step + Math.floor(Math.random() * Math.max(1, step)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [base]);

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-white/75 tabular-nums" title="Views">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white/55" aria-hidden>
        <path
          d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {formatViews(views)}
    </span>
  );
}

function viewsStep(base: number) {
  if (base >= 1_000_000) return Math.max(1, Math.round(base / 180));
  if (base >= 1_000) return Math.max(1, Math.round(base / 1200));
  return 1;
}

function formatViews(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function SortIcon({ id }: { id: SortId }) {
  if (id === "featured") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path fill="currentColor" d="M8 1.4 9.7 5.6l4.5.4-3.4 3 1 4.4L8 11.2 4.2 13.4l1-4.4-3.4-3 4.5-.4L8 1.4z" />
      </svg>
    );
  }
  if (id === "newest") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "volume") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M2 12V8M6 12V4M10 12V6M14 12V2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "trending") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M2 11 6.2 6.8 9 9.2 14 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 4h4v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
