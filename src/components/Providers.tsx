"use client";

import { NotifyProvider } from "@/components/NotifyProvider";
import WalletProvider from "@/components/WalletProvider";

export default function Providers({
  children,
  cookies,
}: {
  children: React.ReactNode;
  cookies: string | null;
}) {
  return (
    <WalletProvider cookies={cookies}>
      <NotifyProvider>{children}</NotifyProvider>
    </WalletProvider>
  );
}
