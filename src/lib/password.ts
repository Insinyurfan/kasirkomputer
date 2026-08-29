import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

// Format: "scrypt:<saltHex>:<hashHex>"
// A ":" delimiter (not "$") avoids dotenv/@next/env treating "$..." as variable
// interpolation when the hash is stored in .env.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined | null,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
  // Both buffers are the same length here, so timingSafeEqual is safe to call.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
