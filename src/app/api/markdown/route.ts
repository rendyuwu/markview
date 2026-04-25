import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { importFromUrl } from "@/lib/url-import";
import { SourceType } from "@/generated/prisma/client";

const MAX_CONTENT_SIZE = 500 * 1024;

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  let body: {
    content?: string;
    title?: string;
    sourceType: "PASTE" | "URL";
    sourceUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sourceType || !["PASTE", "URL"].includes(body.sourceType)) {
    return NextResponse.json(
      { error: "sourceType must be PASTE or URL" },
      { status: 400 }
    );
  }

  let content: string;
  let sourceUrl: string | undefined;

  if (body.sourceType === "URL") {
    if (!body.sourceUrl) {
      return NextResponse.json(
        { error: "sourceUrl is required for URL imports" },
        { status: 400 }
      );
    }
    const result = await importFromUrl(body.sourceUrl);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    content = result.content;
    sourceUrl = body.sourceUrl;
  } else {
    if (!body.content) {
      return NextResponse.json(
        { error: "content is required for paste" },
        { status: 400 }
      );
    }
    content = body.content;
  }

  if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_SIZE) {
    return NextResponse.json(
      { error: "Content exceeds 500KB limit" },
      { status: 400 }
    );
  }

  const shareToken = nanoid(21);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const doc = await prisma.markdownDocument.create({
    data: {
      shareToken,
      ownerId: userId,
      title: body.title || null,
      sourceType: body.sourceType as SourceType,
      sourceUrl: sourceUrl || null,
      content,
      expiresAt,
    },
  });

  return NextResponse.json(
    { id: doc.id, shareToken: doc.shareToken, expiresAt: doc.expiresAt },
    { status: 201 }
  );
}
