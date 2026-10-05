"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { INFLUENCERS, type Influencer } from "@/data/influencers";
import { marketsFor } from "@/data/markets";

const PLACED: { id: string; left: string; top: string }[] = [
  { id: "elon", left: "50%", top: "48%" },
  { id: "ozzy", left: "50%", top: "16%" },
  { id: "cz", left: "24%", top: "30%" },
  { id: "vitalik", left: "76%", top: "28%" },
  { id: "brian", left: "18%", top: "58%" },
  { id: "mert", left: "80%", top: "58%" },
  { id: "ansem", left: "34%", top: "78%" },
  { id: "vlad", left: "68%", top: "78%" },
];

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function UniverseMap() {
  const [selectedId, setSelectedId] = useState("elon");
  const selected = INFLUENCERS.find((person) => person.id === selectedId) ?? INFLUENCERS[0];
  const markets = marketsFor(selected.id);

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-24 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
      <div>
        <p className="text-[12px] font-semibold tracking-[0.16em] text-white/40 uppercase">Influencer universe</p>
        <h1 className="mt-2 text-[40px] leading-none font-semibold tracking-[-0.04em] sm:text-[56px]">
          Who the board trades
        </h1>
        <div className="relative mx-auto mt-8 aspect-square w-full max-w-[640px]">
          {[18, 33, 46].map((radius) => (
            <div
              key={radius}
              className="absolute rounded-full border border-white/10"
              style={{
                width: `${radius * 2}%`,
                height: `${radius * 2}%`,
                left: `${50 - radius}%`,
                top: `${50 - radius}%`,
              }}
            />
          ))}
          {PLACED.map((spot) => {
            const person = INFLUENCERS.find((item) => item.id === spot.id);
            if (!person) return null;
            const on = person.id === selected.id;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedId(person.id)}
                className="absolute w-[92px] -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: spot.left, top: spot.top }}
              >
                <span
                  className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
                    on ? "ring-2 ring-white ring-offset-2 ring-offset-[#070d16]" : ""
                  }`}
                >
                  <Image
                    src={person.avatar}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                </span>
                <span className="mt-1.5 block truncate text-[12px] font-semibold text-white/90">{person.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <ProfileCard person={selected} marketCount={markets.length} />
    </div>
  );
}

function ProfileCard({ person, marketCount }: { person: Influencer; marketCount: number }) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <Image src={person.avatar} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
      <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.03em]">{person.name}</h2>
      <p className="text-[14px] text-white/55">@{person.handle}</p>
      <p className="mt-1 text-[13px] text-white/40">{compact(person.followers)} followers</p>
      <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-white/80">{person.bio}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={`https://x.com/${person.handle}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#070d16]"
        >
          View on X
        </a>
        {marketCount > 0 ? (
          <Link
            href={`/markets?u=${person.id}`}
            className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white"
          >
            {marketCount} {marketCount === 1 ? "market" : "markets"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
