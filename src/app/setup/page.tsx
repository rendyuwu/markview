import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    notFound();
  }

  return <SetupForm />;
}
