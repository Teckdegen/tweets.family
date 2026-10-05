"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import XLogo from "@/components/XLogo";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/universe", label: "Universe" },
  { href: "/#how", label: "How it works" },
] as const;

function active(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({ account }: { account: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname === "/") return null;

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/[0.06] bg-[#0c0c0e]">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center bg-transparent text-white/80"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
            <path d="M3 5.5h14M3 10h14M3 14.5h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="shrink-0 text-[18px] font-black tracking-[-0.05em] text-white italic">
          tweets.cc
        </Link>
        <div className="w-[min(360px,56vw)] min-w-0 shrink">
          <Suspense fallback={<div className="h-10 rounded-full border border-white/10 bg-white/[0.03]" />}>
            <InfluencerSearch />
          </Suspense>
        </div>
        <div className="ml-auto shrink-0">{account}</div>
      </div>
    </header>
    {open ? (
      <div className="fixed inset-0 z-[170]" onClick={() => setOpen(false)} role="presentation">
        <div className="absolute inset-0 bg-black/55" />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={(event) => event.stopPropagation()}
          className="sidebar-in absolute inset-y-0 left-0 flex w-[220px] max-w-[78vw] flex-col border-r border-white/[0.06] bg-[#101012] text-white"
        >
          <div className="flex h-14 items-center justify-between px-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-[18px] font-black tracking-[-0.05em] text-white italic"
            >
              tweets.cc
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center bg-transparent text-white/80"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                <path d="M3 5.5h14M3 10h14M3 14.5h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="mt-1 flex flex-col gap-0.5 px-2.5">
            {LINKS.map((link) => {
              const on = active(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-[14px] font-semibold ${
                    on ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <NavIcon href={link.href} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-white/[0.08] px-4 pt-4 pb-5">
            <p className="text-[12px] text-white/40">© 2026 tweets.cc</p>
            <div className="mt-3 flex gap-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/80 hover:border-white/25 hover:text-white"
              >
                <XLogo className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/80 hover:border-white/25 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M21.5 3.4 18.7 21c-.2.9-.7 1.1-1.5.7l-4.2-3.1-2 1.9c-.2.2-.4.4-.9.4l.3-4.3 7.8-7c.3-.3 0-.5-.4-.2l-9.7 6.1-4.2-1.3c-.9-.3-.9-.9.2-1.3L20.3 2.6c.8-.3 1.5.2 1.2.8z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </aside>
      </div>
    ) : null}
    </>
  );
}

function NavIcon({ href }: { href: string }) {
  if (href === "/markets") {
    return (
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M4 13.5h12M4 10h12M4 6.5h12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3.5 4.5h13v11h-13z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (href === "/universe") {
    return (
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
        <circle cx="10" cy="10" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3.75c1.8 1.8 2.7 4 2.7 6.25s-.9 4.45-2.7 6.25c-1.8-1.8-2.7-4-2.7-6.25s.9-4.45 2.7-6.25Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 10h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.1 8.1a1.9 1.9 0 1 1 2.7 1.75c-.55.28-.8.62-.8 1.15V12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.1" r="0.7" fill="currentColor" />
    </svg>
  );
}

function InfluencerSearch() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/markets" className="relative">
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden>
        <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12.5 12.5 16.5 16.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        key={query}
        name="q"
        defaultValue={query}
        placeholder="Search influencers"
        aria-label="Search influencers"
        className="h-10 w-full rounded-full border border-white/10 bg-white/[0.03] pr-12 pl-10 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-white/25"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] text-white/35">
        /
      </kbd>
    </form>
  );
}
