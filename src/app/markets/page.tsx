import type { Metadata } from "next";
import MarketsBoard from "@/components/markets/MarketsBoard";
import { influencerById } from "@/data/influencers";
import { MARKETS } from "@/data/markets";
import { boardStats } from "@/lib/board";

export const metadata: Metadata = {
  title: "Markets · tweets.cc",
};

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; q?: string }>;
}) {
  const { u, q } = await searchParams;
  const rows = MARKETS.flatMap((market) => {
    const person = influencerById(market.influencerId);
    if (!person) return [];
    return [{ market, person, stats: boardStats(market) }];
  });

  return (
    <main className="min-h-screen bg-[#0c0c0e] px-4 pt-[4.5rem] pb-16 text-white sm:px-6">
      <MarketsBoard rows={rows} query={typeof q === "string" ? q : ""} focusId={u ? influencerById(u)?.id ?? null : null} />
    </main>
  );
}
