import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await destroySession();
  return NextResponse.json({ success: true }, { status: 200 });
}
