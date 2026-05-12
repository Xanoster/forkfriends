import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";

type Params = {
  params: Promise<{
    id: string;
    messageId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id, messageId } = await params;
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        dinner: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!message || message.dinnerId !== id) {
      throw new ApiError("Message not found.", 404);
    }

    const isHost = message.dinner.creatorId === user.id;
    const isAuthor = message.userId === user.id;

    if (!isHost && !isAuthor) {
      throw new ApiError("You cannot delete this message.", 403);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        text: isHost && !isAuthor ? "[This message was deleted by the host]" : "[This message was deleted]",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
