import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tcc_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

// cookie value: "<x user id>.<expiry unix seconds>.<hmac>"
export function createSessionValue(xUserId: string) {
  const payload = `${xUserId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value: string | undefined): string | null {
  if (!value) return null;
  const [xUserId, expiry, signature] = value.split(".");
  if (!xUserId || !expiry || !signature) return null;
  const expected = Buffer.from(sign(`${xUserId}.${expiry}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expiry) < Date.now() / 1000) return null;
  return xUserId;
}

export async function getSessionUserId() {
  try {
    const store = await cookies();
    return readSessionValue(store.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}
