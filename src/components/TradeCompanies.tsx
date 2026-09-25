"use client";

import { useMemo, useState } from "react";
import MiniPost from "@/components/MiniPost";
import { useNotify } from "@/components/NotifyProvider";
import { POSTS, type Multiplier } from "@/data/posts";

const FEED = [POSTS.mira, POSTS.jax, POSTS.rio] as const;

export default function TradeCompanies({ fill = false }: { fill?: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(POSTS.mira.handle);
  const notify = useNotify();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEED;
    return FEED.filter(
      (post) =>
        post.handle.toLowerCase().includes(q) ||
        post.text.toLowerCase().includes(q) ||
        post.market.toLowerCase().includes(q),
    );
  }, [query]);

  function openPost(handle: string, avatar: string, odds: string) {
    setOpen(open === handle ? null : handle);
    notify({
      title: `${handle} popped`,
      body: `${odds} live — pick how many X engagement goes`,
      avatar,
    });
  }

  function placeBet(handle: string, avatar: string, mult: Multiplier) {
    notify({
      title: `Bet ${mult} on ${handle}`,
      body: `You priced this tweet's engagement at ${mult}`,
      avatar,
    });
  }

  return (
    <section
      id="markets"
      className={`hero-bg relative overflow-hidden px-4 sm:px-8 ${
        fill ? "flex h-full min-h-full items-center py-8" : "min-h-screen py-16"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center justify-center">
        <h2 className="mb-7 text-center text-[24px] leading-[1.2] font-bold tracking-[-0.03em] text-white drop-shadow-[0_8px_24px_rgba(20,70,100,0.18)] sm:mb-8 sm:text-[28px] md:text-[32px]">
          Bet the X
          <br />
          on engagement.
        </h2>

        <div className="flex w-full max-w-[520px] items-center gap-2.5">
          <span className="hero-glass grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full sm:h-[56px] sm:w-[56px]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
              <path d="M13.6 13.6 L17 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="tweets.cc, how many X does this go?"
            className="hero-glass h-[52px] flex-1 rounded-full px-5 text-[15px] text-white outline-none placeholder:text-white/80 sm:h-[56px] sm:px-6 sm:text-[16px]"
          />
        </div>

        <div className="mt-6 flex w-full max-w-[520px] flex-col gap-3 sm:mt-7">
          {filtered.map((post) => (
            <div
              key={post.handle}
              role="button"
              tabIndex={0}
              onClick={() => openPost(post.handle, post.avatar, post.odds)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPost(post.handle, post.avatar, post.odds);
                }
              }}
              className="w-full cursor-pointer text-left"
            >
              <MiniPost
                post={post}
                variant="dark"
                layout="row"
                onBet={
                  open === post.handle
                    ? (mult) => placeBet(post.handle, post.avatar, mult)
                    : undefined
                }
              />
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="hero-glass rounded-[22px] px-5 py-4 text-center text-[14px] text-white/80">
              No posts match that search.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
