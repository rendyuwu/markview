"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";

type SourceMode = "PASTE" | "URL";

const MAX_CONTENT_BYTES = 500 * 1024;

export function HomeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<SourceMode>("PASTE");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (mode === "PASTE") {
      if (!content.trim()) {
        setError("Please enter some markdown content.");
        return;
      }
      if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES) {
        setError("Content exceeds 500KB limit.");
        return;
      }
    } else {
      if (!url.trim()) {
        setError("Please enter a URL.");
        return;
      }
    }

    setLoading(true);

    try {
      const body =
        mode === "PASTE"
          ? { sourceType: "PASTE" as const, content, title: title || undefined }
          : { sourceType: "URL" as const, sourceUrl: url, title: title || undefined };

      const res = await fetch("/api/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      router.push(`/editor/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-6 justify-center">
        <button
          type="button"
          onClick={() => setMode("PASTE")}
          className={`rounded-pill px-5 py-2 text-sm font-body cursor-pointer ${
            mode === "PASTE"
              ? "bg-light-gray text-near-black"
              : "bg-transparent text-stone"
          }`}
        >
          Paste
        </button>
        <button
          type="button"
          onClick={() => setMode("URL")}
          className={`rounded-pill px-5 py-2 text-sm font-body cursor-pointer ${
            mode === "URL"
              ? "bg-light-gray text-near-black"
              : "bg-transparent text-stone"
          }`}
        >
          URL
        </button>
      </div>

      {error && (
        <p className="text-sm text-mid-gray bg-snow border border-light-gray rounded-container px-4 py-2 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="title"
          label="Title (optional)"
          placeholder="My document"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {mode === "PASTE" ? (
          <Textarea
            id="content"
            label="Markdown content"
            placeholder={"# Hello World\n\nStart typing your markdown here..."}
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
        ) : (
          <Input
            id="url"
            label="Markdown file URL"
            type="url"
            placeholder="https://raw.githubusercontent.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        <Button type="submit" variant="cta" disabled={loading} className="mt-2">
          {loading ? "Creating..." : "Create document"}
        </Button>
      </form>
    </>
  );
}
