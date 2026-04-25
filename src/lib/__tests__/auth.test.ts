import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("hashPassword", () => {
  it("returns a bcrypt hash starting with $2b$", async () => {
    const hash = await hashPassword("testpassword");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("uses cost factor >= 10 (V11)", async () => {
    const hash = await hashPassword("testpassword");
    const costStr = hash.split("$")[2];
    const cost = parseInt(costStr, 10);
    expect(cost).toBeGreaterThanOrEqual(10);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const hash1 = await hashPassword("samepassword");
    const hash2 = await hashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("correctpassword", hash);
    expect(result).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });
});

describe("password storage safety (V11)", () => {
  it("hash does not contain the original password", async () => {
    const password = "mysecretpassword123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
  });

  it("hash has expected bcrypt length (60 chars)", async () => {
    const hash = await hashPassword("anypassword");
    expect(hash.length).toBe(60);
  });
});
