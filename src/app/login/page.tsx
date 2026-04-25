import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const userCount = await prisma.user.count();
  const enableRegister = process.env.ENABLE_REGISTER === "true";

  const footer = (
    <>
      {enableRegister && (
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-pure-black underline">
            Register
          </Link>
        </span>
      )}
      {userCount === 0 && (
        <span className={enableRegister ? "ml-4" : ""}>
          <Link href="/setup" className="text-pure-black underline">
            First-time setup
          </Link>
        </span>
      )}
    </>
  );

  return <LoginForm footer={footer} />;
}
