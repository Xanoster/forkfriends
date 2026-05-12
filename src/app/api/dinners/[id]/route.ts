import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { dateAndTimeToStartsAt } from "@/lib/time";
import { dinnerInclude, serializeDinner } from "@/lib/serializers";
import { dinnerSchema } from "@/lib/validators";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const dinner = await prisma.dinner.findUnique({
      where: { id },
      include: dinnerInclude,
    });

    if (!dinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    return NextResponse.json({ dinner: serializeDinner(dinner) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const body = dinnerSchema.parse(await request.json());
    const existingDinner = await prisma.dinner.findUnique({
      where: { id },
      include: {
        attendees: true,
      },
    });

    if (!existingDinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    if (existingDinner.creatorId !== user.id) {
      throw new ApiError("Only the host can edit this dinner.", 403);
    }

    if (body.maxGuests < existingDinner.attendees.length) {
      throw new ApiError("Maximum guests cannot be below the current booking count.");
    }

    const startsAt = dateAndTimeToStartsAt(body.date, body.time);
    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError("Dinner date and time are invalid.");
    }

    const dinner = await prisma.dinner.update({
      where: { id },
      data: {
        restaurantName: body.restaurantName,
        address: body.address,
        city: body.city,
        cuisine: body.cuisine,
        dietary: body.dietary,
        budget: body.budget,
        maxGuests: body.maxGuests,
        startsAt,
      },
      include: dinnerInclude,
    });

    return NextResponse.json({ dinner: serializeDinner(dinner) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const dinner = await prisma.dinner.findUnique({
      where: { id },
      select: {
        creatorId: true,
      },
    });

    if (!dinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    if (dinner.creatorId !== user.id) {
      throw new ApiError("Only the host can delete this dinner.", 403);
    }

    await prisma.dinner.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
