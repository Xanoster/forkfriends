import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userSelect } from "@/lib/serializers";

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

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
};

export const requireCurrentUser = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new ApiError("You must be signed in.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError("Your account could not be found.", 401);
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
