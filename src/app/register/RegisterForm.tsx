"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

const fields = [
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
  { name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "Repeat password" },
];

interface RegisterFormProps {
  footer?: React.ReactNode;
}

export function RegisterForm({ footer }: RegisterFormProps) {
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Registration failed");
    }

    router.push("/login");
  }

  return (
    <AuthForm
      title="Create an account"
      fields={fields}
      submitLabel="Register"
      onSubmit={handleSubmit}
      footer={footer}
    />
  );
}
