import type { Metadata } from "next";
import UniverseMap from "@/components/universe/UniverseMap";

export const metadata: Metadata = {
  title: "Influencer universe · tweets.cc",
};

export default function UniversePage() {
  return (
    <main className="min-h-screen bg-[#070d16] text-white">
      <UniverseMap />
    </main>
  );
}
