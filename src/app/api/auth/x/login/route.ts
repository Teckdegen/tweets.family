import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_COOKIE, callbackUrl, oauthCookieOptions } from "@/lib/xauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) return new Response("X_CLIENT_ID is not set", { status: 500 });

  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const authorize = new URL("https://x.com/i/oauth2/authorize");
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl(request.nextUrl.origin),
    scope: "tweet.read users.read",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier }), oauthCookieOptions);
  return response;
}
