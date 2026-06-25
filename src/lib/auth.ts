import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pakindex_session";

// ── Roles ───────────────────────────────────────────────────────────────────
// Must match the `user_role` enum in the Postgres schema exactly.
export type UserRole = "super_admin" | "company_admin" | "employee";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string | null;
}

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in .env");
  }
  return new TextEncoder().encode(secret);
}

// ── Passwords ────────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Session tokens (JWT stored in an httpOnly cookie) ───────────────────────
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Convenience helper for use inside Route Handlers / Server Components.
// (The `proxy.ts` file already blocks unauthenticated requests before they
// get here — this just lets a route read *who* is logged in.)
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
