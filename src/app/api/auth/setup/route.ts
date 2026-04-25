import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isValidEmail, validatePassword } from "@/lib/validation";

export async function POST(request: Request) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Setup is no longer available" },
      { status: 403 }
    );
  }

  let body: { email?: string; password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { email, password, confirmPassword } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const existingCount = await tx.user.count();
      if (existingCount > 0) {
        throw new Error("SETUP_UNAVAILABLE");
      }
      await tx.user.create({ data: { email, passwordHash } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SETUP_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Setup is no longer available" },
        { status: 403 }
      );
    }
    throw err;
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
