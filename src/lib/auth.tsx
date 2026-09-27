"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: "google" | "email";
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  hasGoogle: boolean;
  signOut: () => Promise<void>;
  getToken: (options?: { template?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { getToken: clerkGetToken } = useClerkAuth();

  // Map Clerk's user to the shape the rest of the app already consumes.
  //
  // Read the primitive fields OUT of Clerk's user resource first, then
  // memoize on THOSE. Clerk re-creates the UserResource object whenever it
  // refreshes the user, and an OAuth account is refreshed more often than a
  // password one (its external-account data and provider tokens are
  // revalidated). Memoizing on the object identity therefore handed out a
  // brand-new `user` object on each refresh even though nothing had changed,
  // which restarted every effect keyed on `user` — including the leaderboard
  // fetch, which then never got to finish.
  const clerkId = user?.id;
  const fullName = user?.fullName;
  const username = user?.username;
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const imageUrl = user?.imageUrl;
  const createdAtIso = user?.createdAt?.toISOString();
  const isGoogle = !!user?.externalAccounts?.some(
    (acc) => acc.provider === "google"
  );

  const mapped = useMemo<AuthUser | null>(() => {
    if (!isSignedIn || !clerkId) return null;
    return {
      id: clerkId,
      name: fullName || username || primaryEmail?.split("@")[0] || "Pengguna",
      email: primaryEmail ?? "",
      provider: isGoogle ? "google" : "email",
      avatarUrl: imageUrl,
      createdAt: createdAtIso ?? new Date().toISOString(),
    };
  }, [
    isSignedIn,
    clerkId,
    fullName,
    username,
    primaryEmail,
    imageUrl,
    createdAtIso,
    isGoogle,
  ]);

  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: mapped,
      isLoaded,
      hasGoogle: true,
      signOut,
      getToken: clerkGetToken,
    }),
    [mapped, isLoaded, signOut, clerkGetToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
