// "Sign in with X" (OAuth 2.0 with PKCE). Callback URL to register in the X developer portal:
//   https://<your domain>/api/auth/x/callback

export const OAUTH_COOKIE = "tcc_oauth";

export const oauthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
};

export function callbackUrl(origin: string) {
  return `${process.env.SITE_URL || origin}/api/auth/x/callback`;
}

export type XUser = {
  id: string;
  username: string;
  name?: string;
  description?: string;
  profile_image_url?: string;
  profile_banner_url?: string;
  verified?: boolean;
  created_at?: string;
  public_metrics?: { followers_count?: number; following_count?: number };
};

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
  const clientId = process.env.X_CLIENT_ID || "";
  const clientSecret = process.env.X_CLIENT_SECRET || "";
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(clientSecret
        ? { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` }
        : {}),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      client_id: clientId,
    }),
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    throw new Error(`token exchange failed: ${json.error_description || json.error || response.status}`);
  }
  return json.access_token as string;
}

const BASE_FIELDS = "name,username,description,profile_image_url,verified,created_at,public_metrics";

export async function fetchMe(accessToken: string): Promise<XUser> {
  // profile_banner_url isn't available on every API tier; retry without it if X rejects it
  for (const fields of [`${BASE_FIELDS},profile_banner_url`, BASE_FIELDS]) {
    const response = await fetch(`https://api.x.com/2/users/me?user.fields=${fields}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = await response.json().catch(() => ({}));
    if (response.ok && json.data) return json.data as XUser;
    if (response.status !== 400) throw new Error(`users/me failed: ${json.title || response.status}`);
  }
  throw new Error("users/me failed");
}

export function largeAvatar(url?: string) {
  return url ? url.replace("_normal.", "_400x400.") : null;
}
