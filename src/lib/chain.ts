// Read-only token (USDG) lookups on Robinhood Chain over plain JSON-RPC.

export const CHAIN = {
  id: Number(process.env.CHAIN_ID || 4663),
  rpc: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
  token: process.env.TOKEN_ADDRESS || process.env.USDC_ADDRESS || "",
};

async function ethCall(data: string): Promise<bigint> {
  const response = await fetch(CHAIN.rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: CHAIN.token, data }, "latest"],
    }),
    cache: "no-store",
  });
  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return BigInt(json.result);
}

let decimals: number | null = null;

async function tokenDecimals() {
  if (decimals === null) decimals = Number(await ethCall("0x313ce567"));
  return decimals;
}

export async function tokenBalance(address: string | null | undefined): Promise<number | null> {
  if (!CHAIN.token || !address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
  try {
    const raw = await ethCall(`0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`);
    const scale = BigInt(10) ** BigInt(await tokenDecimals());
    return Number(raw / scale) + Number(raw % scale) / Number(scale);
  } catch {
    return null;
  }
}
