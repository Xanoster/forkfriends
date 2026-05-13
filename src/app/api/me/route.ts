import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { serializeUser, userSelect } from "@/lib/serializers";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const updates = profileSchema.parse(await request.json());

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: userSelect,
    });

    return NextResponse.json({ user: serializeUser(updatedUser) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(new ApiError("That username is already taken.", 409));
    }

    return jsonError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    const { userId: clerkUserId } = await auth();

    await prisma.user.delete({
      where: { id: user.id },
    });

    // Also delete the Clerk account so the user isn't re-created on next auth check
    if (clerkUserId) {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
