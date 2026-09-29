import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { loadProfile } from "@/lib/profile";
import ProfileView from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile · tweets.cc",
};

export default async function ProfilePage() {
  const xUserId = await getSessionUserId();
  if (!xUserId) redirect("/api/auth/x/login");

  const profile = await loadProfile(xUserId);
  // signed in but no account row (e.g. it was deleted): sign in again to recreate it
  if (!profile) redirect("/api/auth/x/login");

  return <ProfileView profile={profile} />;
}
