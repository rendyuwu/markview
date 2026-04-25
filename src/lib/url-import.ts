import { resolve4, resolve6 } from "node:dns/promises";

const PRIVATE_RANGES_V4 = [
  { prefix: [10], bits: 8 },
  { prefix: [172, 16], bits: 12 },
  { prefix: [192, 168], bits: 16 },
  { prefix: [127], bits: 8 },
  { prefix: [169, 254], bits: 16 },
  { prefix: [0], bits: 8 },
];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return true;

  for (const range of PRIVATE_RANGES_V4) {
    let match = true;
    if (range.bits === 8) {
      match = parts[0] === range.prefix[0];
    } else if (range.bits === 12) {
      match = parts[0] === range.prefix[0] && parts[1] >= 16 && parts[1] <= 31;
    } else if (range.bits === 16) {
      match =
        parts[0] === range.prefix[0] && parts[1] === range.prefix[1];
    }
    if (match) return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  if (normalized.startsWith("::ffff:")) {
    const embedded = normalized.slice(7);
    if (embedded.includes(".")) return isPrivateIPv4(embedded);
  }
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost") return true;
  if (lower.endsWith(".local")) return true;
  return false;
}

const MAX_SIZE = 1_000_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

async function validateUrl(
  url: string
): Promise<{ parsed: URL } | { error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "Invalid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http and https URLs are supported" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { error: "URL points to a blocked host" };
  }

  try {
    const [v4Addrs, v6Addrs] = await Promise.allSettled([
      resolve4(parsed.hostname),
      resolve6(parsed.hostname),
    ]);

    const allAddrs: string[] = [];
    if (v4Addrs.status === "fulfilled") allAddrs.push(...v4Addrs.value);
    if (v6Addrs.status === "fulfilled") allAddrs.push(...v6Addrs.value);

    if (allAddrs.length === 0) {
      return { error: "Could not resolve hostname" };
    }

    for (const addr of allAddrs) {
      if (addr.includes(":")) {
        if (isPrivateIPv6(addr))
          return { error: "URL resolves to a private IP address" };
      } else {
        if (isPrivateIPv4(addr))
          return { error: "URL resolves to a private IP address" };
      }
    }
  } catch {
    return { error: "Could not resolve hostname" };
  }

  return { parsed };
}

export async function importFromUrl(
  url: string
): Promise<{ content: string } | { error: string }> {
  const initial = await validateUrl(url);
  if ("error" in initial) return initial;

  let currentUrl = url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response: Response | undefined;

    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
      });

      const status = response.status;
      if (status >= 300 && status < 400) {
        const location = response.headers.get("location");
        if (!location) return { error: "Redirect with no Location header" };

        const redirectUrl = new URL(location, currentUrl).toString();
        const check = await validateUrl(redirectUrl);
        if ("error" in check) return { error: `Redirect blocked: ${check.error}` };

        currentUrl = redirectUrl;
        continue;
      }

      break;
    }

    if (!response || (response.status >= 300 && response.status < 400)) {
      return { error: "Too many redirects" };
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return { error: "Response exceeds 1MB size limit" };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return { error: "No response body" };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.byteLength;
      if (totalSize > MAX_SIZE) {
        reader.cancel();
        return { error: "Response exceeds 1MB size limit" };
      }
      chunks.push(value);
    }

    const decoder = new TextDecoder();
    return {
      content:
        chunks.map((c) => decoder.decode(c, { stream: true })).join("") +
        decoder.decode(),
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { error: "Request timed out after 10 seconds" };
    }
    return {
      error: `Fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
