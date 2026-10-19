"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { projectId } from "@/config/wallet";

const buttonClass =
  "rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#070d16] transition hover:bg-white/90 active:scale-[0.98]";

export default function ConnectWalletButton() {
  if (!projectId) {
    return (
      <button type="button" className={`${buttonClass} cursor-not-allowed opacity-60`} disabled>
        Connect wallet
      </button>
    );
  }
  return <WalletButton />;
}

function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const label =
    isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet";

  return (
    <button type="button" onClick={() => void open()} className={buttonClass}>
      {label}
    </button>
  );
}
