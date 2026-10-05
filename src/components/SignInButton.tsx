"use client";

import { useEffect, useState } from "react";
import XLogo from "@/components/XLogo";

// "Sign in with X" opens a short consent step first: X's off-platform matching rules require
// opt-in consent before we link someone's X account to their tweets.cc wallet.
export default function SignInButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#070d16] transition hover:bg-white/90 active:scale-[0.98]"
      >
        Sign in
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[380px] rounded-t-[28px] bg-white px-6 pt-6 pb-8 text-center text-[#0b1020] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:pb-6"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-black text-white">
              <XLogo className="h-5 w-5" />
            </span>
            <h2 id="signin-title" className="mt-4 text-[20px] font-bold tracking-[-0.02em]">
              Sign in with X
            </h2>
            <p className="mt-2 text-[15px] leading-snug text-[#5b6b8c]">
              Signing in links your X account to your tweets.cc wallet.
            </p>
            {/* a plain <a>: this is a route handler that redirects to X, not a page */}
            <a
              href="/api/auth/x/login"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black text-[16px] font-semibold text-white transition hover:bg-[#1a1a1a] active:scale-[0.98]"
            >
              <XLogo className="h-4 w-4" />
              Continue with X
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 h-11 w-full rounded-full text-[15px] font-semibold text-[#5b6b8c] transition hover:bg-black/[0.04]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
