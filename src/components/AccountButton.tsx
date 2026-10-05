import Link from "next/link";
import Image from "next/image";
import XLogo from "@/components/XLogo";
import SignInButton from "@/components/SignInButton";
import { getSessionUserId } from "@/lib/session";
import { loadAccount } from "@/lib/profile";

// Header, top right: "Sign in" when signed out, the user's X avatar (→ /profile) when signed in.
export default async function AccountButton() {
  const xUserId = await getSessionUserId();
  const account = xUserId ? await loadAccount(xUserId).catch(() => null) : null;

  return account ? (
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-[14px] font-semibold text-white transition hover:bg-white/15"
        >
          {account.avatar_url ? (
            <Image
              src={account.avatar_url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
              <XLogo className="h-4 w-4" />
            </span>
          )}
          @{account.username}
        </Link>
  ) : (
    <SignInButton />
  );
}
