import { prisma } from "./prisma";

export async function cleanupExpiredDocs(): Promise<number> {
  const expired = await prisma.markdownDocument.findMany({
    where: {
      expiresAt: { lt: new Date() },
      isDeleted: false,
    },
    select: { id: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  const result = await prisma.markdownDocument.updateMany({
    where: { id: { in: expired.map((d) => d.id) } },
    data: { isDeleted: true },
  });

  return result.count;
}
