import Image from "next/image";
import type { Multiplier, Post } from "@/data/posts";
import { MULTIPLIERS } from "@/data/posts";

type Variant = "ice" | "dark" | "white";

const styles: Record<
  Variant,
  {
    card: string;
    name: string;
    meta: string;
    text: string;
    stats: string;
    market: string;
    odds: string;
  }
> = {
  ice: {
    card: "border border-white/55 bg-white/40 shadow-[0_10px_28px_rgba(90,160,185,0.12)] backdrop-blur-xl",
    name: "text-[#2c4a55]",
    meta: "text-[#7a96a0]",
    text: "text-[#35515c]",
    stats: "text-[#7a96a0]",
    market: "bg-white/80 text-[#5b7c88]",
    odds: "text-[#2c4a55]",
  },
  dark: {
    card: "border border-white/28 bg-white/[0.14] shadow-[0_10px_28px_rgba(18,60,90,0.12)] backdrop-blur-xl",
    name: "text-white",
    meta: "text-white/60",
    text: "text-white/90",
    stats: "text-white/55",
    market: "bg-white/10 text-white/70",
    odds: "text-white",
  },
  white: {
    card: "bg-white shadow-[0_10px_24px_rgba(30,70,110,0.10)]",
    name: "text-[#222]",
    meta: "text-[#8b8b8b]",
    text: "text-[#444]",
    stats: "text-[#9aa3a8]",
    market: "bg-[#f3f6f8] text-[#555]",
    odds: "text-[#3aa0d6]",
  },
};

export default function MiniPost({
  post,
  variant = "ice",
  quoted,
  onBet,
  size = "md",
  layout = "card",
}: {
  post: Post;
  variant?: Variant;
  quoted?: Post;
  onBet?: (mult: Multiplier) => void;
  size?: "md" | "lg";
  layout?: "card" | "row";
}) {
  const s = styles[variant];
  const lg = size === "lg";
  const up = !post.change.startsWith("-");

  if (layout === "row") {
    return (
      <article
        className={`w-full text-left ${s.card} ${
          lg
            ? "rounded-[36px] px-5 py-5 sm:px-6 sm:py-6"
            : "rounded-[28px] px-4 py-3.5 sm:px-5 sm:py-4"
        }`}
      >
        <div className={`flex items-center ${lg ? "gap-4" : "gap-3"}`}>
          <span
            className={`relative shrink-0 overflow-hidden rounded-[12px] bg-[#d7e6ee] ${
              lg ? "h-[52px] w-[52px] sm:h-14 sm:w-14" : "h-10 w-10 sm:h-11 sm:w-11"
            }`}
          >
            <Image
              src={post.avatar}
              alt={post.handle}
              fill
              className="object-cover object-top"
              sizes={lg ? "56px" : "44px"}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p
                className={`truncate font-semibold ${
                  lg ? "text-[19px] sm:text-[21px]" : "text-[15px] sm:text-[16px]"
                } ${s.name}`}
              >
                {post.name}
              </p>
              {post.verified ? (
                <span
                  className={`grid place-items-center rounded-full bg-[#1d9bf0] text-white ${
                    lg ? "h-4 w-4 text-[9px]" : "h-3.5 w-3.5 text-[8px]"
                  }`}
                >
                  ✓
                </span>
              ) : null}
            </div>
            <p
              className={`mt-0.5 truncate ${
                lg ? "text-[15px] sm:text-[16px]" : "text-[12px] sm:text-[13px]"
              } ${s.text}`}
            >
              {post.text}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`font-medium ${lg ? "text-[14px]" : "text-[11px]"} ${s.meta}`}>
              Engagement
            </p>
            <p
              className={`mt-0.5 font-semibold ${
                lg ? "text-[18px] sm:text-[20px]" : "text-[14px] sm:text-[15px]"
              } ${
                variant === "dark"
                  ? s.odds
                  : up
                    ? "text-[#4db392]"
                    : "text-[#e05670]"
              }`}
            >
              {up ? "▲" : "▼"} {post.odds}
            </p>
          </div>
        </div>

        {onBet ? (
          <div className={`grid grid-cols-4 ${lg ? "mt-4 gap-2.5" : "mt-3 gap-2"}`}>
            {MULTIPLIERS.map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onBet(mult);
                }}
                className={`rounded-full bg-[#111827] font-bold text-white hover:bg-black ${
                  lg
                    ? "px-3 py-2.5 text-[15px] sm:py-3 sm:text-[16px]"
                    : "px-2 py-2 text-[12px] sm:py-2.5 sm:text-[13px]"
                }`}
              >
                {mult}
              </button>
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={`w-full text-left ${s.card} ${
        lg ? "rounded-[24px] p-5 sm:p-6" : "rounded-[18px] p-3"
      }`}
    >
      <div className={`flex items-start ${lg ? "gap-4" : "gap-2.5"}`}>
        <span
          className={`relative mt-0.5 shrink-0 overflow-hidden rounded-full bg-[#d7e6ee] ${
            lg ? "h-14 w-14 sm:h-16 sm:w-16" : "h-9 w-9"
          }`}
        >
          <Image
            src={post.avatar}
            alt={post.handle}
            fill
            className="object-cover object-top"
            sizes={lg ? "64px" : "36px"}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={`font-bold ${lg ? "text-[20px] sm:text-[22px]" : "text-[13px]"} ${s.name}`}>
              {post.name}
            </p>
            {post.verified ? (
              <span
                className={`grid place-items-center rounded-full bg-[#1d9bf0] text-white ${
                  lg ? "h-5 w-5 text-[11px]" : "h-3.5 w-3.5 text-[8px]"
                }`}
              >
                ✓
              </span>
            ) : null}
            <p className={`truncate ${lg ? "text-[16px]" : "text-[12px]"} ${s.meta}`}>
              {post.handle} · {post.time}
            </p>
          </div>
          <p
            className={`mt-1.5 leading-[1.45] ${
              lg ? "text-[17px] sm:text-[19px]" : "text-[13px] leading-[1.4]"
            } ${s.text}`}
          >
            {post.text}
          </p>

          {quoted ? (
            <div className="mt-2 flex items-start gap-2 rounded-[14px] border border-black/5 bg-black/[0.03] p-2.5">
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={quoted.avatar}
                  alt={quoted.handle}
                  fill
                  className="object-cover object-top"
                  sizes="24px"
                />
              </span>
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold ${s.name}`}>
                  {quoted.handle} · {quoted.time}
                </p>
                <p className={`mt-0.5 line-clamp-2 text-[11px] ${s.meta}`}>
                  {quoted.text}
                </p>
              </div>
            </div>
          ) : null}

          <div
            className={`mt-3 flex items-center ${lg ? "gap-5 text-[15px]" : "gap-3 text-[11px]"} ${s.stats}`}
          >
            <span>💬 {post.replies}</span>
            <span>↻ {post.rts}</span>
            <span>♡ {post.likes}</span>
          </div>

          <div className={`flex items-center justify-between gap-2 ${lg ? "mt-4" : "mt-2.5"}`}>
            <span
              className={`rounded-full font-semibold ${
                lg ? "px-4 py-1.5 text-[14px]" : "px-2.5 py-1 text-[11px]"
              } ${s.market}`}
            >
              {post.market}
            </span>
            <span className={`font-bold ${lg ? "text-[18px]" : "text-[13px]"} ${s.odds}`}>
              {post.odds} live
            </span>
          </div>

          {onBet ? (
            <div className={`grid grid-cols-4 ${lg ? "mt-4 gap-2.5" : "mt-2 gap-1.5"}`}>
              {MULTIPLIERS.map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onBet(mult);
                  }}
                  className={`rounded-full bg-[#111827] font-bold text-white hover:bg-black ${
                    lg ? "px-3 py-3 text-[15px] sm:text-[16px]" : "px-2 py-1.5 text-[11px]"
                  }`}
                >
                  {mult}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
