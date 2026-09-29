"use client";

import { useCallback, useEffect, useState } from "react";
import QrCode from "@/components/profile/QrCode";
import { money } from "@/components/profile/format";
import { NETWORK_NAME, TOKEN_SYMBOL } from "@/lib/token";

type Props = {
  open: boolean;
  onClose: () => void;
  initialAddress: string | null;
  initialBalance: number | null;
  onBalance: (balance: number | null) => void;
};

function TokenBadge() {
  return (
    <span className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-[#0050FD] align-[-3px] text-[11px] font-black text-white">
      G
    </span>
  );
}

export default function FundModal({ open, onClose, initialAddress, initialBalance, onBalance }: Props) {
  const [address, setAddress] = useState(initialAddress);
  const [balance, setBalance] = useState(initialBalance);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/account", { cache: "no-store" });
    if (response.ok) {
      const json = await response.json();
      setAddress(json.wallet_address);
      setBalance(json.balance);
      onBalance(json.balance);
    }
  }, [onBalance]);

  // while open, keep the balance live so a deposit shows up by itself; poll faster until a
  // brand-new account has been given its deposit address by the bot
  useEffect(() => {
    if (!open) return;
    const load = () => refresh().catch(() => {});
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, address ? 10000 : 4000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [open, address, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0050FD]/25 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[440px] rounded-t-[32px] bg-white px-5 pt-3 pb-8 text-[#0b1020] shadow-[0_-24px_70px_rgba(0,80,253,0.25)] sm:rounded-[32px] sm:pb-7"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0050FD]/15" />

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-0 grid h-9 w-9 place-items-center rounded-full text-[#0050FD] transition hover:bg-[#0050FD]/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 id="deposit-title" className="text-[20px] font-bold tracking-[-0.02em]">
            Deposit crypto
          </h2>
        </div>

        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#5b6b8c]">
          Send {TOKEN_SYMBOL} on the {NETWORK_NAME} network.
          <br />
          Deposit <TokenBadge /> <span className="font-semibold text-[#0b1020]">{TOKEN_SYMBOL}</span> to add to
          your cash balance.
        </p>

        {/* balance */}
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#0050FD]/[0.07] px-4 py-2 text-[14px]">
          <span className="text-[#5b6b8c]">Balance</span>
          <span className="font-bold">
            {balance === null ? "—" : money(balance)} {TOKEN_SYMBOL}
          </span>
        </div>

        {/* QR */}
        <div className="mx-auto mt-5 grid h-[248px] w-[248px] place-items-center rounded-[32px] bg-[#0050FD] shadow-[0_18px_40px_rgba(0,80,253,0.3)]">
          {address ? (
            <QrCode value={address} size={208} />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center text-[14px] text-white/85">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Setting up your wallet…
            </div>
          )}
        </div>

        {address ? (
          <p className="mx-auto mt-5 max-w-[300px] text-center text-[17px] leading-snug font-medium tracking-[0.01em] break-all">
            {address}
          </p>
        ) : null}

        <button
          type="button"
          onClick={copy}
          disabled={!address}
          className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-full bg-[#0050FD] px-6 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(0,80,253,0.3)] transition hover:bg-[#1a63ff] active:scale-[0.98] disabled:opacity-40"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <rect x="8" y="8" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
          {copied ? "Copied" : "Copy wallet address"}
        </button>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-[#8a97b3]">
          Only send {TOKEN_SYMBOL} on {NETWORK_NAME}. No gas needed, we cover it.
        </p>
      </div>
    </div>
  );
}
