import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { userSelect } from "@/lib/serializers";
import { uniqueUsernameFromEmail } from "@/lib/validators";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const jsonError = (error: unknown) => {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.errors[0]?.message || "Please check your input and try again." },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
};

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

export const requireCurrentUser = async () => {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new ApiError("You must be signed in.", 401);
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) {
    throw new ApiError("Your Clerk account is missing a primary email.", 400);
  }

  const normalizedEmail = primaryEmail.toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: userSelect,
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          normalizedEmail.split("@")[0],
        username: await makeUniqueUsername(normalizedEmail),
        avatarSeed: normalizedEmail,
        passwordHash: "__clerk_managed__",
      },
      select: userSelect,
    });
  }

  return user;
};

export const isDinnerParticipant = async (dinnerId: string, userId: string) => {
  const attendee = await prisma.dinnerAttendee.findUnique({
    where: {
      dinnerId_userId: {
        dinnerId,
        userId,
      },
    },
  });

  return Boolean(attendee);
};
