import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketView from "@/components/markets/MarketView";
import { influencerById } from "@/data/influencers";
import { MARKETS, marketById } from "@/data/markets";

export function generateStaticParams() {
  return MARKETS.map((market) => ({ id: market.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const market = marketById(id);
  const person = market ? influencerById(market.influencerId) : null;
  return { title: person ? `${person.name} · tweets.cc` : "Market · tweets.cc" };
}

export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const { m } = await searchParams;
  const market = marketById(id);
  if (!market) notFound();
  const person = influencerById(market.influencerId);
  if (!person) notFound();
  const picked = Number(m);
  const initialMinutes = Number.isInteger(picked) && picked >= 1 && picked <= 60 ? picked : 30;
  return <MarketView market={market} person={person} initialMinutes={initialMinutes} />;
}
