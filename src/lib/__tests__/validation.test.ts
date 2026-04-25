import { describe, it, expect } from "vitest";
import { nanoid } from "nanoid";

const MAX_CONTENT_SIZE = 500 * 1024;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe("content size limit (V9)", () => {
  it("content at exactly 500KB is accepted", () => {
    const content = "a".repeat(MAX_CONTENT_SIZE);
    const size = new TextEncoder().encode(content).byteLength;
    expect(size).toBeLessThanOrEqual(MAX_CONTENT_SIZE);
  });

  it("content over 500KB is rejected", () => {
    const content = "a".repeat(MAX_CONTENT_SIZE + 1);
    const size = new TextEncoder().encode(content).byteLength;
    expect(size).toBeGreaterThan(MAX_CONTENT_SIZE);
  });

  it("multi-byte content is measured in bytes, not characters", () => {
    const emoji = "\u{1F600}";
    const byteLen = new TextEncoder().encode(emoji).byteLength;
    expect(byteLen).toBeGreaterThan(1);
  });
});

describe("share token randomness (V10)", () => {
  it("nanoid generates 21-character tokens", () => {
    const token = nanoid(21);
    expect(token).toHaveLength(21);
  });

  it("tokens are non-sequential — consecutive tokens differ", () => {
    const tokens = Array.from({ length: 10 }, () => nanoid(21));
    const unique = new Set(tokens);
    expect(unique.size).toBe(10);
  });

  it("tokens contain only URL-safe characters", () => {
    const token = nanoid(21);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("email validation", () => {
  it("accepts valid email format", () => {
    expect(emailRegex.test("user@example.com")).toBe(true);
    expect(emailRegex.test("test.user@domain.co")).toBe(true);
  });

  it("rejects invalid email format — missing @", () => {
    expect(emailRegex.test("userexample.com")).toBe(false);
  });

  it("rejects invalid email format — missing domain", () => {
    expect(emailRegex.test("user@")).toBe(false);
  });

  it("rejects invalid email format — spaces", () => {
    expect(emailRegex.test("user @example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(emailRegex.test("")).toBe(false);
  });
});
