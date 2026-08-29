// Stateless signed session token. Uses the Web Crypto API so the same code runs
// in the Edge middleware and in Node server components / actions.

const encoder = new TextEncoder();

export const SESSION_COOKIE = "shinzi_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60; // one shop day
export const SESSION_TTL_REMEMBER = 30 * 24 * 60 * 60; // "ingat saya"

type SessionPayload = { uid: number; exp: number };

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  secret: string,
  uid: number,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    uid,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = bytesToB64url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** Verify signature + expiry; returns the payload, or null if invalid. */
export async function readSessionToken(
  secret: string | undefined,
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!secret || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  let sigBytes: Uint8Array;
  try {
    sigBytes = b64urlToBytes(sigPart);
  } catch {
    return null;
  }

  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(body),
  );
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(b64urlToBytes(body));
    const payload = JSON.parse(json) as SessionPayload;
    if (
      typeof payload.exp !== "number" ||
      typeof payload.uid !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Boolean-only check for the Edge middleware. */
export async function verifySessionToken(
  secret: string | undefined,
  token: string | undefined | null,
): Promise<boolean> {
  return (await readSessionToken(secret, token)) !== null;
}
