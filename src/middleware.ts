import { NextResponse, type NextRequest } from "next/server";
import { getIronSession, type SessionOptions } from "iron-session";
import type { SessionData } from "./lib/auth";

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

function createCookieStore(req: NextRequest) {
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

async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionData> {
  const store = createCookieStore(req);
  return getIronSession<SessionData>(store, sessionOptions);
}

const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/view/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/view/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname === "/setup") {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/markdown") &&
    request.method !== "GET"
  ) {
    const session = await getSessionFromRequest(request);
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/" || pathname.startsWith("/editor")) {
    const session = await getSessionFromRequest(request);
    if (!session.userId) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
