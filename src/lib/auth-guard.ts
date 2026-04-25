import { getIronSession, type SessionOptions } from "iron-session";
import type { SessionData } from "./auth";

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "markview-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.split("=");
    if (key) result[key.trim()] = rest.join("=").trim();
  }
  return result;
}

function createCookieStore(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const parsed = parseCookies(cookieHeader);
  return {
    get(name: string) {
      const value = parsed[name];
      return value !== undefined ? { name, value } : undefined;
    },
    set() {},
  };
}

export async function requireAuth(request: Request): Promise<string> {
  const store = createCookieStore(request);
  const session = await getIronSession<SessionData>(store, sessionOptions);
  if (!session.userId) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session.userId;
}

export async function getOptionalSession(
  request: Request
): Promise<string | null> {
  const store = createCookieStore(request);
  const session = await getIronSession<SessionData>(store, sessionOptions);
  return session.userId || null;
}
