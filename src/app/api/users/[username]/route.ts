import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError } from "@/lib/api-auth";
import { serializeUser, userSelect } from "@/lib/serializers";

type Params = {
  params: Promise<{
    username: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { username } = await params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: userSelect,
    });

    if (!user) {
      throw new ApiError("User not found.", 404);
    }

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    return jsonError(error);
  }
}
