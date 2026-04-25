import { describe, it, expect, vi, beforeEach } from "vitest";
import { importFromUrl } from "@/lib/url-import";

vi.mock("node:dns/promises", () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

import { resolve4, resolve6 } from "node:dns/promises";

const mockResolve4 = vi.mocked(resolve4);
const mockResolve6 = vi.mocked(resolve6);

function mockPublicDns() {
  mockResolve4.mockResolvedValue(["93.184.216.34"]);
  mockResolve6.mockRejectedValue(new Error("no AAAA"));
}

function mockDnsTo(ipv4: string[], ipv6: string[] = []) {
  if (ipv4.length) mockResolve4.mockResolvedValue(ipv4);
  else mockResolve4.mockRejectedValue(new Error("no A"));
  if (ipv6.length) mockResolve6.mockResolvedValue(ipv6);
  else mockResolve6.mockRejectedValue(new Error("no AAAA"));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("URL protocol validation", () => {
  it("rejects ftp:// URLs", async () => {
    const result = await importFromUrl("ftp://example.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/http/i);
  });

  it("rejects file:// URLs", async () => {
    const result = await importFromUrl("file:///etc/passwd");
    expect(result).toHaveProperty("error");
  });

  it("rejects javascript: URLs", async () => {
    const result = await importFromUrl("javascript:alert(1)");
    expect(result).toHaveProperty("error");
  });
});

describe("SSRF protection — blocked hosts (V7)", () => {
  it("blocks localhost", async () => {
    const result = await importFromUrl("https://localhost/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/blocked/i);
  });

  it("blocks 127.0.0.1", async () => {
    mockDnsTo(["127.0.0.1"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks 10.x.x.x private IPs", async () => {
    mockDnsTo(["10.0.0.1"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks 192.168.x.x private IPs", async () => {
    mockDnsTo(["192.168.1.1"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks 172.16.x.x private IPs", async () => {
    mockDnsTo(["172.16.0.1"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks 172.31.x.x private IPs", async () => {
    mockDnsTo(["172.31.255.255"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks ::1 IPv6 loopback", async () => {
    mockDnsTo([], ["::1"]);
    const result = await importFromUrl("https://evil.com/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/private/i);
  });

  it("blocks .local hostnames", async () => {
    const result = await importFromUrl("https://myserver.local/file.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/blocked/i);
  });
});

describe("size limit enforcement (V8)", () => {
  it("rejects responses over 1MB via content-length header", async () => {
    mockPublicDns();
    const bigSize = (1_000_001).toString();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-length": bigSize }),
        body: null,
      })
    );

    const result = await importFromUrl("https://example.com/big.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/1MB/i);
  });

  it("rejects responses over 1MB via streaming body", async () => {
    mockPublicDns();
    const bigChunk = new Uint8Array(1_000_001);
    let readCount = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (readCount === 0) {
          readCount++;
          return Promise.resolve({ done: false, value: bigChunk });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
      cancel: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        body: { getReader: () => mockReader },
      })
    );

    const result = await importFromUrl("https://example.com/big.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/1MB/i);
  });
});

describe("timeout enforcement (V8)", () => {
  it("returns timeout error when fetch is aborted", async () => {
    mockPublicDns();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new DOMException("The operation was aborted.", "AbortError")
      )
    );

    const result = await importFromUrl("https://example.com/slow.md");
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toMatch(/timed out/i);
  });

  it("passes an AbortSignal to fetch", async () => {
    mockPublicDns();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          cancel: vi.fn(),
        }),
      },
    });
    vi.stubGlobal("fetch", mockFetch);

    await importFromUrl("https://example.com/file.md");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
