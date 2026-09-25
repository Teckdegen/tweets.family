"use client";

import { useLayoutEffect, useRef } from "react";
import Hero from "@/components/Hero";
import TradeCompanies from "@/components/TradeCompanies";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export default function DarkHero() {
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const iceRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const wrap = videoRef.current;
    const ice = iceRef.current;
    const media = mediaRef.current;
    const overlay = overlayRef.current;
    if (!track || !wrap || !ice || !media || !overlay) return;

    let frame = 0;

    const scrubLayer = (
      layer: HTMLElement,
      shrinkT: number,
      blurTarget?: HTMLElement,
    ) => {
      const scale = lerp(1, 0.045, shrinkT);
      const fadeT = clamp((shrinkT - 0.42) / 0.58, 0, 1);
      const blur = fadeT * 24;
      layer.style.inset = "0";
      layer.style.width = "100%";
      layer.style.height = "100%";
      layer.style.transformOrigin = "50% 50%";
      layer.style.transform = `scale(${scale})`;
      layer.style.opacity = String(1 - fadeT);
      layer.style.pointerEvents = shrinkT > 0.5 ? "none" : "auto";
      if (blurTarget) {
        blurTarget.style.filter = blur > 0.4 ? `blur(${blur}px)` : "none";
      } else {
        layer.style.filter = blur > 0.4 ? `blur(${blur}px)` : "none";
      }
    };

    const kick = () => {
      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;
      media.setAttribute("muted", "");
      media.setAttribute("playsinline", "true");
      media.setAttribute("webkit-playsinline", "true");
      const attempt = media.play();
      if (attempt) attempt.catch(() => {});
    };

    const apply = () => {
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = clamp(-track.getBoundingClientRect().top / total, 0, 1);
      const videoT = easeOutCubic(clamp(p / 0.3, 0, 1));
      const iceT = easeOutCubic(clamp((p - 0.36) / 0.58, 0, 1));

      scrubLayer(wrap, videoT, media);
      wrap.style.filter = "none";
      if (videoT < 0.001) wrap.style.transform = "none";
      scrubLayer(ice, iceT);

      overlay.style.opacity = String(1 - clamp(videoT * 1.55, 0, 1));
      overlay.style.pointerEvents = videoT > 0.14 ? "none" : "auto";
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    apply();
    kick();
    media.addEventListener("loadeddata", kick);
    media.addEventListener("canplay", kick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("pointerdown", kick);
    return () => {
      media.removeEventListener("loadeddata", kick);
      media.removeEventListener("canplay", kick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("pointerdown", kick);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={trackRef}
      id="clouds"
      className="relative z-20 h-[554vh] w-full"
      style={{
        fontFamily:
          "var(--font-readex), 'Readex Pro', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <TradeCompanies fill />
        </div>
        <div
          ref={iceRef}
          className="absolute inset-0 z-10 origin-center will-change-transform"
        >
          <Hero />
        </div>
        <div
          ref={videoRef}
          id="video-hero"
          className="absolute inset-0 z-20 origin-center pointer-events-none"
        >
          <video
            ref={mediaRef}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src={VIDEO_SRC}
          />
        </div>

        <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-30">
          <h1 className="hero-title absolute top-[18%] left-4 text-[14vw] font-medium text-white md:left-10 md:text-[13vw]">
            bet
          </h1>
          <h1 className="hero-title absolute top-[38%] right-4 text-[14vw] font-medium text-white md:right-10 md:text-[13vw]">
            on
          </h1>
          <h1 className="hero-title absolute top-[58%] left-[18%] text-[14vw] font-medium text-white md:left-[28%] md:text-[13vw]">
            tweets
          </h1>

          <p className="absolute top-[46%] left-6 max-w-[240px] text-[15px] leading-snug text-white/90 md:left-10">
            we let you bet how many x a tweet goes viral, before the rest of the
            timeline even wakes up
          </p>

          <div className="absolute top-[14%] right-6 md:right-24">
            <div className="flex items-center justify-end gap-3">
              <span className="hidden h-px w-24 rotate-[20deg] bg-white/40 md:block" />
              <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
                +65k
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-white/70 md:text-sm">
              bets placed
            </p>
          </div>

          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-b from-transparent to-black" />

          <div className="absolute bottom-20 left-6 md:bottom-24 md:left-20">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
                +1.5b
              </span>
              <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" />
            </div>
            <p className="mt-1 text-xs text-white/70 md:text-sm">
              impressions priced
            </p>
          </div>

          <div className="absolute right-6 bottom-16 md:right-20 md:bottom-20">
            <div className="flex items-center justify-end gap-3">
              <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" />
              <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
                +300k
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-white/70 md:text-sm">
              posts tracked
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
