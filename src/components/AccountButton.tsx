import Link from "next/link";
import Image from "next/image";
import XLogo from "@/components/XLogo";
import SignInButton from "@/components/SignInButton";
import { getSessionUserId } from "@/lib/session";
import { loadAccount } from "@/lib/profile";

// Top-right corner: "Sign in with X" when signed out, the user's X avatar (→ /profile) when signed in.
export default async function AccountButton() {
  const xUserId = await getSessionUserId();
  const account = xUserId ? await loadAccount(xUserId).catch(() => null) : null;

  return (
    // above the landing page's pop-up notifications (z-80)
    <div className="fixed top-4 right-4 z-[90] sm:top-5 sm:right-6">
      {account ? (
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full bg-black/80 py-1.5 pr-4 pl-1.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-black"
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
      )}
    </div>
  );
}
