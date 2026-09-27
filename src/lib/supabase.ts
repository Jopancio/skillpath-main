"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The dashboard names this key NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// fall back to the legacy anon-key name so either spelling works.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Client-side Supabase client. Requests are authorized with a Clerk session
 * token (native Clerk <-> Supabase integration adds role: authenticated).
 * RLS keys on the token's `sub` claim (Clerk user ID). Falls back to null
 * when env keys are missing, in which case the app runs localStorage-only.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

type GetToken = () => Promise<string | null>;

let cachedClient: SupabaseClient | null = null;
let cachedToken: string | null = null;

function clientFor(token: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (cachedClient && cachedToken === token) return cachedClient;
  cachedClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  cachedToken = token;
  return cachedClient;
}

export async function fetchUserData<T>(
  table: "progress" | "custom_courses",
  userId: string,
  getToken: GetToken
): Promise<T | null> {
  if (!supabase) return null;
  const token = await getToken();
  if (!token) return null;
  const client = clientFor(token);
  if (!client) return null;
  const { data } = await client
    .from(table)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.data as T | undefined) ?? null;
}

export async function persistUserData(
  table: "progress" | "custom_courses",
  userId: string,
  data: unknown,
  getToken: GetToken
) {
  if (!supabase) return;
  const token = await getToken();
  if (!token) return;
  const client = clientFor(token);
  if (!client) return;
  await client
    .from(table)
    .upsert(
      {
        user_id: userId,
        data,
        updated_at: new Date().toISOString(),
      }
    );
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  xp: number;
  streak: number;
  lessons_done: number;
  updated_at: string;
  // Added by supabase/leaderboard_v2.sql — absent until that migration runs.
  courses_created?: number;
  ai_asks?: number;
  quizzes_passed?: number;
  certificates?: number;
  badges_count?: number;
}

/** Columns a leaderboard category can be ranked by. */
export type LeaderboardMetric =
  | "xp"
  | "streak"
  | "lessons_done"
  | "courses_created"
  | "ai_asks"
  | "quizzes_passed"
  | "badges_count";

export type LeaderboardFetchResult =
  | { status: "ok"; rows: LeaderboardRow[] }
  | { status: "error"; message: string }
  | { status: "unconfigured" };

/**
 * Top rows ranked by one metric (ties broken by XP). Used by the
 * /leaderboard page. Reports a failed read explicitly so the page can tell
 * "nobody has this stat yet" apart from "the v2 migration was not run".
 */
export async function fetchLeaderboardBy(
  metric: LeaderboardMetric,
  limit: number,
  getToken: GetToken
): Promise<LeaderboardFetchResult> {
  if (!supabase) return { status: "unconfigured" };
  const token = await getToken();
  if (!token) return { status: "unconfigured" };
  const client = clientFor(token);
  if (!client) return { status: "unconfigured" };
  let query = client
    .from("leaderboard")
    .select("*")
    .order(metric, { ascending: false });
  if (metric !== "xp") query = query.order("xp", { ascending: false });
  const { data, error } = await query
    .limit(limit)
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    console.warn(`[leaderboard] select by ${metric} failed:`, error.message);
    return { status: "error", message: error.message };
  }
  return { status: "ok", rows: (data as LeaderboardRow[] | null) ?? [] };
}

/** Top rows of the public leaderboard, best XP first. */
export async function fetchTopLeaderboard(
  limit: number,
  getToken: GetToken
): Promise<LeaderboardRow[] | null> {
  if (!supabase) return null;
  const token = await getToken();
  if (!token) return null;
  const client = clientFor(token);
  if (!client) return null;
  const { data, error } = await client
    .from("leaderboard")
    .select("*")
    .order("xp", { ascending: false })
    .order("streak", { ascending: false })
    .limit(limit)
    // Bounded like the progress read. Without a deadline a hung request never
    // resolves, and the caller's loading state stays on screen forever.
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    // Discarding this made an RLS/token rejection look identical to "no
    // Supabase configured" — an empty board with no clue why. Return [] so
    // the caller can tell "configured but the read failed" from "not
    // configured at all" (null).
    console.warn("[leaderboard] select failed:", error.message);
    return [];
  }
  return (data as LeaderboardRow[] | null) ?? [];
}

/**
 * Set once a v2-column upsert is rejected (supabase/leaderboard_v2.sql not
 * run yet), so later saves go straight to the legacy payload instead of
 * failing first every time.
 */
let leaderboardV2Missing = false;

/** Publish the signed-in learner's stats so they appear on the board. */
export async function upsertLeaderboardEntry(
  userId: string,
  entry: {
    displayName: string;
    xp: number;
    streak: number;
    lessonsDone: number;
    coursesCreated: number;
    aiAsks: number;
    quizzesPassed: number;
    certificates: number;
    badgesCount: number;
  },
  getToken: GetToken
) {
  if (!supabase) return;
  const token = await getToken();
  if (!token) return;
  const client = clientFor(token);
  if (!client) return;
  const legacy = {
    user_id: userId,
    display_name: entry.displayName,
    xp: entry.xp,
    streak: entry.streak,
    lessons_done: entry.lessonsDone,
    updated_at: new Date().toISOString(),
  };
  if (!leaderboardV2Missing) {
    const { error } = await client.from("leaderboard").upsert({
      ...legacy,
      courses_created: entry.coursesCreated,
      ai_asks: entry.aiAsks,
      quizzes_passed: entry.quizzesPassed,
      certificates: entry.certificates,
      badges_count: entry.badgesCount,
    });
    if (!error) return;
    // Unknown column → migration missing. Anything else: don't mask it.
    if (!/column|schema cache/i.test(error.message)) {
      console.warn("[leaderboard] publish failed:", error.message);
      return;
    }
    leaderboardV2Missing = true;
    console.warn(
      "[leaderboard] v2 columns missing — run supabase/leaderboard_v2.sql. Publishing basic stats only."
    );
  }
  // Keep the dashboard board working even before the v2 migration.
  await client.from("leaderboard").upsert(legacy);
}


export interface PublicProfileRow {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  lessons_done: number;
  courses_completed: number;
  certificates: number;
  badges: Record<string, string>;
  featured_badges: string[];
  updated_at: string;
}

/**
 * One learner's public profile.
 * - `null`       → Supabase not configured (localStorage-only mode)
 * - `"missing"`  → configured, but that learner has no profile row yet
 * Throws on a failed read so the caller can show an error, not "not found".
 */
export async function fetchPublicProfile(
  userId: string,
  getToken: GetToken
): Promise<PublicProfileRow | "missing" | null> {
  if (!supabase) return null;
  const token = await getToken();
  if (!token) return null;
  const client = clientFor(token);
  if (!client) return null;
  const { data, error } = await client
    .from("public_profiles")
    .select("*")
    .eq("user_id", userId)
    .abortSignal(AbortSignal.timeout(15000))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PublicProfileRow | null) ?? "missing";
}

/** Publish the signed-in learner's public profile. */
export async function upsertPublicProfile(
  userId: string,
  profile: Omit<PublicProfileRow, "user_id" | "updated_at">,
  getToken: GetToken
) {
  if (!supabase) return;
  const token = await getToken();
  if (!token) return;
  const client = clientFor(token);
  if (!client) return;
  const { error } = await client.from("public_profiles").upsert({
    user_id: userId,
    ...profile,
    updated_at: new Date().toISOString(),
  });
  // Most likely cause: supabase/profiles.sql has not been run yet.
  if (error) console.warn("[profile] publish failed:", error.message);
}
