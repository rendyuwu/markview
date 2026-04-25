"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

const fields = [
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Password" },
];

interface LoginFormProps {
  footer?: React.ReactNode;
}

export function LoginForm({ footer }: LoginFormProps) {
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Login failed");
    }

    const { redirect } = await res.json();
    router.push(redirect || "/");
    router.refresh();
  }

  return (
    <AuthForm
      title="Sign in"
      fields={fields}
      submitLabel="Sign in"
      onSubmit={handleSubmit}
      footer={footer}
    />
  );
}
