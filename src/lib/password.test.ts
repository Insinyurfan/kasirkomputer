import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("shinzi123");
    expect(await verifyPassword("shinzi123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("shinzi123");
    expect(await verifyPassword("nope", hash)).toBe(false);
  });

  it("uses a ':' delimiter so it is dotenv-safe (no '$')", async () => {
    const hash = await hashPassword("x");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash.includes("$")).toBe(false);
  });

  it("rejects malformed input", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(await verifyPassword("x", undefined)).toBe(false);
  });
});
