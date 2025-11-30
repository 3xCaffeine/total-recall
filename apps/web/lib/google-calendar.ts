import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the Google access token for the current user from the session.
 * The access token is stored in the session when using Better Auth with
 * social providers.
 * 
 * Note: To use the access token for Google Calendar API calls, you'll need
 * to configure Better Auth to store the access token in the session or
 * retrieve it from your database where Better Auth stores account data.
 * 
 * @example
 * ```ts
 * // Make a request to your backend API that handles Calendar operations
 * const response = await fetch('/api/calendar/events', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'Meeting', date: '2024-01-01' }),
 * });
 * ```
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Check if the current user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get all accounts linked to the current user.
 */
export async function getUserAccounts() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });

  return accounts ?? [];
}

/**
 * Get the Google account for the current user.
 */
export async function getGoogleAccount() {
  const accounts = await getUserAccounts();
  return accounts.find((account) => account.providerId === "google") ?? null;
}
