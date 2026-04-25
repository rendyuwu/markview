import { prisma } from "@/lib/prisma";
import { cleanupExpiredDocs } from "@/lib/cleanup";
import { ExpiredOrNotFound } from "@/components/ExpiredOrNotFound";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default async function ViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  cleanupExpiredDocs().catch(() => {});

  const doc = await prisma.markdownDocument.findUnique({
    where: { shareToken: token },
  });

  if (!doc || doc.isDeleted || doc.expiresAt < new Date()) {
    return <ExpiredOrNotFound />;
  }

  const createdDate = doc.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const expiresDate = doc.expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[58rem] mx-auto px-4 sm:px-6 py-12">
      {doc.title && (
        <h1 className="font-display text-4xl font-medium text-pure-black mb-2" style={{ lineHeight: 1.1 }}>
          {doc.title}
        </h1>
      )}
      <p className="text-sm text-silver mb-8">
        Created {createdDate} &middot; Expires {expiresDate}
      </p>
      <div className="border border-light-gray rounded-container p-6 sm:p-8">
        <MarkdownRenderer content={doc.content} />
      </div>
    </div>
  );
}
