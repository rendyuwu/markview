import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("iron-session", () => ({
  getIronSession: vi.fn(),
}));

import { middleware } from "@/middleware";
import { getIronSession } from "iron-session";
import { NextRequest } from "next/server";

const mockedGetIronSession = vi.mocked(getIronSession);

function makeRequest(path: string, method = "GET"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3344"), { method });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("V23: authed users redirected from auth pages", () => {
  it("redirects authed user from /login to /", async () => {
    mockedGetIronSession.mockResolvedValue({ userId: "user-1" } as never);
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3344/");
  });

  it("redirects authed user from /register to /", async () => {
    mockedGetIronSession.mockResolvedValue({ userId: "user-1" } as never);
    const res = await middleware(makeRequest("/register"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3344/");
  });

  it("allows unauthed user to access /login", async () => {
    mockedGetIronSession.mockResolvedValue({} as never);
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows unauthed user to access /register", async () => {
    mockedGetIronSession.mockResolvedValue({} as never);
    const res = await middleware(makeRequest("/register"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
