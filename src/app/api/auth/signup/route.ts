import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeUser, userSelect } from "@/lib/serializers";
import { signupSchema, uniqueUsernameFromEmail } from "@/lib/validators";
import { ApiError, jsonError } from "@/lib/api-auth";

const makeUniqueUsername = async (email: string) => {
  const base = uniqueUsernameFromEmail(email);
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ApiError("An account with this email already exists.", 409);
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        username: await makeUniqueUsername(email),
        avatarSeed: email,
        passwordHash: await hash(body.password, 12),
      },
      select: userSelect,
    });

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
