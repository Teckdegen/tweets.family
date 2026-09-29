import { getSessionUserId } from "@/lib/session";
import { loadAccount } from "@/lib/profile";
import { tokenBalance } from "@/lib/chain";

// Used by the Fund modal: the signed-in user's deposit address and live USDG balance.
export async function GET() {
  const xUserId = await getSessionUserId();
  if (!xUserId) return Response.json({ error: "signed out" }, { status: 401 });
  const account = await loadAccount(xUserId);
  if (!account) return Response.json({ error: "no account" }, { status: 404 });
  return Response.json({
    wallet_address: account.wallet_address,
    balance: await tokenBalance(account.wallet_address),
  });
}
