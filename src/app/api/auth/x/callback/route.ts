import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, createSessionValue, sessionCookieOptions } from "@/lib/session";
import { sbUpsert } from "@/lib/supabase";
import { OAUTH_COOKIE, callbackUrl, exchangeCode, fetchMe, largeAvatar } from "@/lib/xauth";

function back(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin));
  response.cookies.delete(OAUTH_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  let saved: { state?: string; verifier?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value || "{}");
  } catch {}

  // user cancelled on X, or the request wasn't started by us
  if (!code || !state || !saved.verifier || saved.state !== state) {
    return back(request, "/?signin=cancelled");
  }

  try {
    const token = await exchangeCode(code, saved.verifier, callbackUrl(request.nextUrl.origin));
    const me = await fetchMe(token);

    // creates the account (the bot then assigns its deposit wallet) or refreshes the profile;
    // only the columns listed here are written, so an existing wallet_address is kept
    await sbUpsert(
      "accounts",
      {
        x_user_id: me.id,
        username: me.username,
        display_name: me.name || me.username,
        avatar_url: largeAvatar(me.profile_image_url),
        banner_url: me.profile_banner_url || null,
        bio: me.description || null,
        followers_count: me.public_metrics?.followers_count ?? null,
        following_count: me.public_metrics?.following_count ?? null,
        verified: Boolean(me.verified),
        profile_updated_at: new Date().toISOString(),
      },
      "x_user_id",
    );

    const response = back(request, "/profile");
    response.cookies.set(SESSION_COOKIE, createSessionValue(me.id), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("x sign-in", error);
    return back(request, "/?signin=failed");
  }
}
