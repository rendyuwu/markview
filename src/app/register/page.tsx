import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  const enableRegister = process.env.ENABLE_REGISTER === "true";

  if (!enableRegister) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg text-stone font-body mb-4">
            Registration is currently disabled.
          </p>
          <Link href="/login" className="text-pure-black underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const footer = (
    <span>
      Already have an account?{" "}
      <Link href="/login" className="text-pure-black underline">
        Sign in
      </Link>
    </span>
  );

  return <RegisterForm footer={footer} />;
}
