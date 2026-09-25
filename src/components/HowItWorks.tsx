import Image from "next/image";
import MiniPost from "@/components/MiniPost";
import { POSTS } from "@/data/posts";

function Polaroid({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-white p-1.5 pb-5 shadow-[0_12px_28px_rgba(40,80,110,0.14)] ${className ?? ""}`}
    >
      <div className="relative h-full w-full overflow-hidden bg-[#d9e8ee]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="160px" />
      </div>
    </div>
  );
}

function FamilyMark({ className }: { className?: string }) {
  return (
    <span
      className={`font-bold tracking-[-0.04em] text-[#4ec3dc] italic ${className ?? ""}`}
    >
      tweets.cc
    </span>
  );
}

function XMark() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-black text-[11px] font-black text-white">
        𝕏
      </span>
      <span className="text-[13px] font-semibold tracking-[-0.03em] text-[#222]">
        posts
      </span>
    </div>
  );
}

function ChatIcon() {
  return (
    <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#3ec6f0] text-white">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 3.2C2 2.5 2.5 2 3.2 2h5.6C9.5 2 10 2.5 10 3.2v3.2c0 .7-.5 1.2-1.2 1.2H5.6L2 10V3.2Z"
          fill="white"
        />
      </svg>
    </span>
  );
}

function Card01() {
  return (
    <article className="bento-white relative min-h-[320px] overflow-hidden rounded-[28px] p-6 sm:min-h-[340px] sm:p-7">
      <div className="sticker-01 absolute top-5 left-5 grid h-[58px] w-[58px] rotate-[-8deg] place-items-center rounded-[16px] text-[22px] font-extrabold text-[#c9a000]">
        01
      </div>
      <div className="absolute top-7 right-6 rotate-[8deg]">
        <XMark />
      </div>
      <div className="absolute right-8 bottom-[78px] h-[92px] w-[86px] rotate-[12deg]">
        <Polaroid src="/polaroid-group.png" alt="Friends hanging out" className="h-full w-full" />
      </div>
      <div className="absolute bottom-6 left-6 w-[min(100%,250px)]">
        <MiniPost post={POSTS.mira} variant="white" />
      </div>
    </article>
  );
}

function CardOrder() {
  return (
    <article className="bento-blue relative min-h-[320px] overflow-hidden rounded-[28px] p-6 sm:min-h-[340px] sm:p-8">
      <div className="absolute top-1/2 left-1/2 w-[min(86%,340px)] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-[#1b2430] px-4 py-3.5 text-white shadow-[0_20px_40px_rgba(20,40,70,0.28)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#22c55e] text-[11px] font-bold">
              ✓
            </span>
            <p className="text-[14px] font-semibold">Bet filled</p>
          </div>
          <span className="text-[14px] text-white/50">✕</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#22c55e] px-2 py-[3px] text-[11px] font-bold">
              12x
            </span>
            <span className="relative h-5 w-5 overflow-hidden rounded-full bg-white">
              <Image src="/profile-nova.png" alt="" fill className="object-cover object-top" sizes="20px" />
            </span>
            <span className="text-[13px] font-medium">@nova · engagement</span>
          </div>
          <span className="text-[13px] text-white/80">↗ 2.1k on 12x</span>
        </div>
      </div>
    </article>
  );
}

function CardChat() {
  return (
    <article className="bento-blue relative min-h-[320px] overflow-hidden rounded-[28px] p-5 sm:min-h-[340px] sm:p-7">
      <div className="absolute top-1/2 left-1/2 w-[min(90%,360px)] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-4 shadow-[0_18px_40px_rgba(30,70,110,0.16)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative h-7 w-7 overflow-hidden rounded-full bg-[#d7e6ee]">
              <Image src="/profile-rio.png" alt="@rio" fill className="object-cover object-top" sizes="28px" />
            </span>
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-[13px] font-semibold text-[#222]">
                @rio
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#1d9bf0] text-[8px] text-white">
                  ✓
                </span>
              </p>
              <p className="text-[11px] text-[#8b8b8b]">2m · from X</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-[#e8f6ff] px-2 py-[2px] text-[10px] font-semibold text-[#3aa0d6]">
              viral
            </span>
            <span className="rounded-full bg-[#e8f6ff] px-2 py-[2px] text-[10px] font-semibold text-[#3aa0d6]">
              tweets.cc
            </span>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-[1.45] text-[#6a6a6a]">
          this clip is criminal. if this doesn&apos;t hit a million I&apos;m
          logging off forever.
        </p>
        <div className="mt-3 flex items-center gap-4 text-[11px] text-[#9aa3a8]">
          <span>💬 412</span>
          <span>↻ 8.2k</span>
          <span>♡ 61k</span>
          <span>↗</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#f3f6f8] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#333]">
            How many X?
            </span>
            <span className="h-4 w-14 rounded-sm bg-gradient-to-r from-[#9ad7ea] to-[#6ec4de] opacity-80" />
          </div>
          <span className="text-[12px] font-semibold text-[#3aa0d6]">25x live</span>
        </div>
      </div>
    </article>
  );
}

function Card02() {
  return (
    <article className="bento-white relative min-h-[320px] overflow-hidden rounded-[28px] p-6 sm:min-h-[340px] sm:p-7">
      <p className="text-[56px] leading-none font-extrabold tracking-[-0.06em] text-[#cfe8f2]">
        02
      </p>
      <div className="absolute top-[54px] right-6 h-[118px] w-[108px] rotate-[18deg]">
        <div className="relative h-full w-full overflow-hidden rounded-[4px] border-[6px] border-white shadow-[0_14px_30px_rgba(40,80,110,0.16)]">
          <Image src="/polaroid-street.png" alt="Street photo" fill className="object-cover" sizes="160px" />
          <p className="absolute bottom-2 left-0 w-full text-center text-[9px] font-extrabold tracking-[0.22em] text-white">
            @NOVA
          </p>
        </div>
      </div>
      <FamilyMark className="absolute bottom-[92px] left-8 -rotate-6 text-[22px]" />
      <p className="absolute bottom-6 left-6 max-w-[270px] text-[15px] leading-5 text-[#6b7c84]">
        <span className="font-bold text-[#2d3d44]">Price the timeline.</span> Long
        or short a tweet from your phone. If you know it&apos;s about to rip,
        get paid when it does.
      </p>
    </article>
  );
}

function CardOpen() {
  return (
    <article className="bento-white relative min-h-[320px] overflow-hidden rounded-[28px] p-6 sm:min-h-[340px] sm:p-7">
      <div className="absolute top-7 left-6 flex items-center gap-2">
        <span className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image src="/profile-mira.png" alt="" fill className="object-cover object-top" sizes="40px" />
        </span>
        <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
          <Image src="/avatar.png" alt="" fill className="object-cover object-top" sizes="40px" />
        </span>
        <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
          <Image src="/profile-rio.png" alt="" fill className="object-cover object-top" sizes="40px" />
        </span>
      </div>
      <div className="absolute top-8 right-8 h-[100px] w-[92px] rotate-[14deg]">
        <Polaroid src="/polaroid-waymo.png" alt="Going viral" className="h-full w-full" />
      </div>
      <FamilyMark className="absolute bottom-[108px] left-8 -rotate-6 text-[22px]" />
      <p className="absolute bottom-6 left-6 max-w-[250px] text-[15px] leading-5 text-[#6b7c84]">
        <span className="font-bold text-[#2d3d44]">Open to everyone.</span> If you
        can see the tweet, you can bet it. No gatekeeping, no minimums, no
        maximums.
      </p>
    </article>
  );
}

function CardKai() {
  return (
    <article className="bento-blue relative min-h-[320px] overflow-hidden rounded-[28px] p-5 sm:min-h-[340px] sm:p-8">
      <div className="absolute top-1/2 left-1/2 w-[min(88%,340px)] -translate-x-1/2 -translate-y-1/2">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-[#1b2430] px-3 py-1.5 text-[11px] text-white shadow-lg">
          <span className="relative h-4 w-4 overflow-hidden rounded-full">
            <Image src="/kyle.png" alt="" fill className="object-cover" sizes="16px" />
          </span>
          tracking @nova&apos;s tweet
          <span className="text-white/40">✕</span>
        </div>
        <div className="rounded-[22px] bg-white p-4 shadow-[0_18px_40px_rgba(30,70,110,0.16)]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-full bg-[#d7e6ee]">
                <Image src="/kyle.png" alt="kai" fill className="object-cover" sizes="48px" />
              </span>
              <div>
                <p className="flex items-center gap-1 text-[15px] font-bold text-[#222]">
                  @kai
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1d9bf0] text-[9px] text-white">
                    ✓
                  </span>
                </p>
                <p className="text-[12px] text-[#8b8b8b]">
                  184 bets · 71% hit rate
                </p>
              </div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e9f3f7] text-[#5aa7bb]">
              ↗
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#eef6f4] px-2 py-2 text-center">
              <p className="text-[12px] font-bold text-[#1f7a4d]">+$2,140</p>
            </div>
            <div className="rounded-xl bg-[#eef6f4] px-2 py-2 text-center">
              <p className="text-[11px] font-bold text-[#1f7a4d]">24H +$326</p>
            </div>
            <div className="rounded-xl bg-[#e9f2f8] px-2 py-2 text-center">
              <p className="text-[12px] font-bold text-[#3b82c4]">91/100</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="bg-white px-4 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-[#d9f3fb] px-4 py-1 text-[11px] font-semibold tracking-wide text-[#49b3d0]">
            live-virality-markets
          </span>
        </div>

        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:mb-12 md:flex-row">
          <h2 className="max-w-[460px] text-[34px] leading-[1.15] font-bold tracking-[-0.03em] text-[#1b1b1b] sm:text-[42px]">
            Paste the post. <ChatIcon />
            <br />
            tweets.cc does the rest.
          </h2>
          <div className="max-w-[280px] md:text-right">
            <p className="text-[13px] leading-5 text-[#8b9aa1]">
              Take a position on the next viral tweet while the timeline is
              still asleep. Put money on the posts you already argue about.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card01 />
          <CardOrder />
          <CardChat />
          <Card02 />
          <CardOpen />
          <CardKai />
        </div>
      </div>
    </section>
  );
}
