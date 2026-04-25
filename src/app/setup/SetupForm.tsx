"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

const fields = [
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
  { name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "Repeat password" },
];

export function SetupForm() {
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Setup failed");
    }

    router.push("/login");
  }

  return (
    <AuthForm
      title="Create your account"
      fields={fields}
      submitLabel="Create account"
      onSubmit={handleSubmit}
    />
  );
}
