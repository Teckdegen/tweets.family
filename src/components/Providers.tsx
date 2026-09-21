"use client";

import { NotifyProvider } from "@/components/NotifyProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <NotifyProvider>{children}</NotifyProvider>;
}
