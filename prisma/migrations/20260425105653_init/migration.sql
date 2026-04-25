-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PASTE', 'URL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkdownDocument" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarkdownDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MarkdownDocument_shareToken_key" ON "MarkdownDocument"("shareToken");

-- CreateIndex
CREATE INDEX "MarkdownDocument_ownerId_idx" ON "MarkdownDocument"("ownerId");

-- CreateIndex
CREATE INDEX "MarkdownDocument_expiresAt_idx" ON "MarkdownDocument"("expiresAt");

-- AddForeignKey
ALTER TABLE "MarkdownDocument" ADD CONSTRAINT "MarkdownDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
