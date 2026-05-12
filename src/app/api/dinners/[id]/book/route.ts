import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { dinnerInclude, serializeDinner } from "@/lib/serializers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const readDinner = (id: string) =>
  prisma.dinner.findUnique({
    where: { id },
    include: dinnerInclude,
  });

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const dinner = await tx.dinner.findUnique({
        where: { id },
        include: {
          attendees: true,
        },
      });

      if (!dinner) {
        throw new ApiError("Dinner not found.", 404);
      }

      if (dinner.startsAt < new Date()) {
        throw new ApiError("This dinner has already ended.");
      }

      if (dinner.attendees.some((attendee) => attendee.userId === user.id)) {
        return;
      }

      if (dinner.attendees.length >= dinner.maxGuests) {
        throw new ApiError("This dinner is already full.");
      }

      await tx.dinnerAttendee.create({
        data: {
          dinnerId: id,
          userId: user.id,
        },
      });

      if (dinner.creatorId !== user.id) {
        await tx.notification.create({
          data: {
            type: "booking",
            dinnerId: id,
            dinnerName: dinner.restaurantName,
            actorId: user.id,
            actorName: user.name,
            recipientId: dinner.creatorId,
          },
        });
      }
    });

    const dinner = await readDinner(id);
    if (!dinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    return NextResponse.json({ dinner: serializeDinner(dinner) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const dinner = await tx.dinner.findUnique({
        where: { id },
        include: {
          attendees: true,
        },
      });

      if (!dinner) {
        throw new ApiError("Dinner not found.", 404);
      }

      if (dinner.creatorId === user.id) {
        throw new ApiError("Hosts cannot cancel their own attendee slot.");
      }

      const attendee = dinner.attendees.find((item) => item.userId === user.id);
      if (!attendee) {
        return;
      }

      await tx.dinnerAttendee.delete({
        where: {
          dinnerId_userId: {
            dinnerId: id,
            userId: user.id,
          },
        },
      });

      await tx.notification.create({
        data: {
          type: "cancellation",
          dinnerId: id,
          dinnerName: dinner.restaurantName,
          actorId: user.id,
          actorName: user.name,
          recipientId: dinner.creatorId,
        },
      });
    });

    const dinner = await readDinner(id);
    if (!dinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    return NextResponse.json({ dinner: serializeDinner(dinner) });
  } catch (error) {
    return jsonError(error);
  }
}
