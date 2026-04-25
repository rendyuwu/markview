import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "MarkView";

export async function Header() {
  const session = await getSession();
  const isLoggedIn = !!session.userId;

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 w-full">
      <Link href="/" className="font-display font-medium text-xl text-pure-black">
        {appName}
      </Link>

      <nav className="flex items-center gap-4 text-base font-body">
        {isLoggedIn ? (
          <>
            <Link href="/editor" className="text-pure-black">
              Editor
            </Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login" className="text-pure-black">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
