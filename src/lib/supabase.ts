// Minimal server-side Supabase REST client (service role). Never import from client components.

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return { url: url.replace(/\/$/, ""), key };
}

function headers(extra: Record<string, string> = {}) {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

async function fail(response: Response): Promise<never> {
  const text = await response.text().catch(() => "");
  throw new Error(`supabase ${response.status}: ${text}`);
}

export async function sbSelect<T>(table: string, query: Record<string, string>): Promise<T[]> {
  const response = await fetch(`${config().url}/rest/v1/${table}?${new URLSearchParams(query)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok) await fail(response);
  return response.json();
}

export async function sbCount(table: string, query: Record<string, string>): Promise<number> {
  const response = await fetch(`${config().url}/rest/v1/${table}?${new URLSearchParams(query)}`, {
    method: "HEAD",
    headers: headers({ Prefer: "count=exact" }),
    cache: "no-store",
  });
  if (!response.ok) await fail(response);
  const range = response.headers.get("content-range") || "";
  return Number(range.split("/")[1]) || 0;
}

// Upsert that only touches the columns given, so it never clears e.g. wallet_address.
export async function sbUpsert(table: string, row: Record<string, unknown>, onConflict: string) {
  const response = await fetch(`${config().url}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!response.ok) await fail(response);
}
