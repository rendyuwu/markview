import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const MAX_CONTENT_SIZE = 500 * 1024;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  const doc = await prisma.markdownDocument.findUnique({ where: { id } });
  if (!doc || doc.isDeleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { content?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    body.content &&
    new TextEncoder().encode(body.content).byteLength > MAX_CONTENT_SIZE
  ) {
    return NextResponse.json(
      { error: "Content exceeds 500KB limit" },
      { status: 400 }
    );
  }

  const updated = await prisma.markdownDocument.update({
    where: { id },
    data: {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.title !== undefined && { title: body.title }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    shareToken: updated.shareToken,
    title: updated.title,
    content: updated.content,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  const doc = await prisma.markdownDocument.findUnique({ where: { id } });
  if (!doc || doc.isDeleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.markdownDocument.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({ success: true });
}
