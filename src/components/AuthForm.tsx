"use client";

import { type SubmitEvent, useState } from "react";
import { Input } from "./Input";
import { Button } from "./Button";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

interface AuthFormProps {
  title: string;
  fields: FieldConfig[];
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  error?: string;
  footer?: React.ReactNode;
}

export function AuthForm({
  title,
  fields,
  submitLabel,
  onSubmit,
  error: externalError,
  footer,
}: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayError = externalError || error;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.name] = (formData.get(field.name) as string) || "";
    }

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md border border-light-gray rounded-container p-6 sm:p-8">
        <h1 className="text-2xl font-display font-medium text-pure-black mb-6 text-center">
          {title}
        </h1>

        {displayError && (
          <p className="text-sm text-mid-gray bg-snow border border-light-gray rounded-container px-4 py-2 mb-4">
            {displayError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <Input
              key={field.name}
              id={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required !== false}
            />
          ))}

          <Button type="submit" variant="cta" disabled={loading} className="mt-2">
            {loading ? "..." : submitLabel}
          </Button>
        </form>

        {footer && (
          <div className="mt-6 text-center text-sm text-stone">{footer}</div>
        )}
      </div>
    </div>
  );
}
