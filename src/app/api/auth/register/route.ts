import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isValidEmail, validatePassword } from "@/lib/validation";

export async function POST(request: Request) {
  if (process.env.ENABLE_REGISTER !== "true") {
    return NextResponse.json(
      { error: "Registration is disabled" },
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, passwordHash },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
