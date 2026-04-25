"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface EditorClientProps {
  initialContent?: string;
  initialTitle?: string;
  docId?: string;
  shareToken?: string;
}

export function EditorClient({
  initialContent = "",
  initialTitle = "",
  docId,
  shareToken,
}: EditorClientProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentShareToken, setCurrentShareToken] = useState(shareToken || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const isEditing = !!docId;

  const handleSave = useCallback(async () => {
    setError("");
    setSaving(true);

    try {
      if (isEditing) {
        const res = await fetch(`/api/markdown/${docId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title: title || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save.");
          return;
        }
        if (data.shareToken) setCurrentShareToken(data.shareToken);
      } else {
        const res = await fetch("/api/markdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "PASTE",
            content,
            title: title || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save.");
          return;
        }
        router.push(`/editor/${data.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [content, title, docId, isEditing, router]);

  const handleDelete = useCallback(async () => {
    if (!docId) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/markdown/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete.");
        return;
      }
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [docId, router]);

  const shareUrl = currentShareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/view/${currentShareToken}`
    : "";

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
          className="bg-pure-white border border-light-gray rounded-pill px-5 py-2 font-body text-pure-black placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-ring-blue/50 flex-1 w-full sm:w-auto"
        />
        <div className="flex gap-2">
          <Button variant="cta" onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {isEditing && (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-mid-gray bg-snow border border-light-gray rounded-container px-4 py-2">
          {error}
        </p>
      )}

      {currentShareToken && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone">Share link:</span>
          <code className="text-xs bg-snow border border-light-gray rounded-container px-3 py-1 font-mono text-mid-gray truncate max-w-md">
            {shareUrl}
          </code>
          <Button variant="secondary" onClick={copyShareLink} className="text-xs !px-3 !py-1">
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="flex items-center gap-3 bg-snow border border-light-gray rounded-container px-4 py-3">
          <span className="text-sm text-mid-gray">Delete this document?</span>
          <Button variant="cta" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Confirm"}
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0">
          <label className="text-sm text-mid-gray font-body mb-1.5">Editor</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Hello World&#10;&#10;Start typing your markdown here..."
            className="flex-1 bg-pure-white border border-light-gray rounded-container px-5 py-3 font-mono text-sm text-pure-black placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-ring-blue/50 resize-none"
          />
        </div>
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0">
          <label className="text-sm text-mid-gray font-body mb-1.5">Preview</label>
          <div className="flex-1 border border-light-gray rounded-container px-5 py-3 overflow-y-auto">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
