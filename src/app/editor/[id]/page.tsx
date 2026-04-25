import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditorClient } from "../editor-client";

export default async function EditDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    notFound();
  }

  const doc = await prisma.markdownDocument.findUnique({ where: { id } });

  if (!doc || doc.isDeleted || doc.ownerId !== session.userId) {
    notFound();
  }

  return (
    <EditorClient
      initialContent={doc.content}
      initialTitle={doc.title || ""}
      docId={doc.id}
      shareToken={doc.shareToken}
    />
  );
}
