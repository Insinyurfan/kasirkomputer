import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SESSION_TTL_REMEMBER,
  createSessionToken,
  readSessionToken,
} from "./session";

export type Role = "ADMIN" | "MEMBER";

export type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  isOwner: boolean;
};

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return s;
}

/** True when no account exists yet — the app should send the user to /setup. */
export async function needsSetup(): Promise<boolean> {
  return (await prisma.user.count()) === 0;
}

export async function startSession(
  userId: number,
  remember = false,
): Promise<void> {
  const ttl = remember ? SESSION_TTL_REMEMBER : SESSION_TTL_SECONDS;
  const token = await createSessionToken(sessionSecret(), userId, ttl);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Also returns null if the account was deleted. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await readSessionToken(process.env.SESSION_SECRET, token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as Role,
    isOwner: user.isOwner,
  };
}

/**
 * Guard for protected pages and every Server Action. Redirects and never
 * returns null. Sends first-run visitors to /setup.
 */
export async function requireUser(): Promise<CurrentUser> {
  if (await needsSetup()) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) {
    await destroySession();
    redirect("/login");
  }
  return user;
}

/** Requires an ADMIN (owner counts as admin). Members are bounced to /pos. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/pos");
  return user;
}

/** Requires the Owner (the first account). Everyone else is bounced to /pos. */
export async function requireOwner(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isOwner) redirect("/pos");
  return user;
}
