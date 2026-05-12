import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireCurrentUser } from "@/lib/api-auth";
import { serializeNotification } from "@/lib/serializers";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ notifications: notifications.map(serializeNotification) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireCurrentUser();
    await prisma.notification.updateMany({
      where: {
        recipientId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    await prisma.notification.deleteMany({
      where: {
        recipientId: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
