import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, isDinnerParticipant, jsonError, requireCurrentUser } from "@/lib/api-auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const canRead = await isDinnerParticipant(id, user.id);

    if (!canRead) {
      throw new ApiError("You must be attending this dinner to mark chat as read.", 403);
    }

    await prisma.message.updateMany({
      where: {
        dinnerId: id,
        NOT: {
          readByIds: {
            has: user.id,
          },
        },
      },
      data: {
        readByIds: {
          push: user.id,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
