import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, isDinnerParticipant, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { messageInclude, serializeMessage } from "@/lib/serializers";
import { messageSchema } from "@/lib/validators";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const assertCanReadDinnerChat = async (dinnerId: string, userId: string) => {
  const canRead = await isDinnerParticipant(dinnerId, userId);
  if (!canRead) {
    throw new ApiError("You must be attending this dinner to use the chat.", 403);
  }
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    await assertCanReadDinnerChat(id, user.id);

    const messages = await prisma.message.findMany({
      where: {
        dinnerId: id,
      },
      include: messageInclude,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ comments: messages.map(serializeMessage) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    await assertCanReadDinnerChat(id, user.id);

    const body = messageSchema.parse(await request.json());
    const message = await prisma.message.create({
      data: {
        dinnerId: id,
        userId: user.id,
        text: body.text,
        readByIds: [user.id],
      },
      include: messageInclude,
    });

    return NextResponse.json({ comment: serializeMessage(message) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
