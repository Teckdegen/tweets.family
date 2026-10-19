"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { projectId, robinhood, robinhoodRpc, wagmiAdapter } from "@/config/wallet";

const queryClient = new QueryClient();

if (projectId && wagmiAdapter) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [robinhood],
    defaultNetwork: robinhood,
    metadata: {
      name: "tweets.cc",
      description: "Bet how far an X post's engagement goes.",
      url: "https://tweetsfamily.vercel.app",
      icons: ["https://tweetsfamily.vercel.app/icon.png"],
    },
    customRpcUrls: {
      "eip155:4663": [{ url: robinhoodRpc }],
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#3dffb0",
      "--w3m-z-index": 200,
    },
    features: { analytics: false },
  });
}

export default function WalletProvider({
  children,
  cookies,
}: {
  children: React.ReactNode;
  cookies: string | null;
}) {
  if (!wagmiAdapter) return children;

  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
