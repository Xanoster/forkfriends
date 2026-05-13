import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { dateAndTimeToStartsAt } from "@/lib/time";
import { dinnerInclude, serializeDinner } from "@/lib/serializers";
import { dinnerSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;

    const dinners = await prisma.dinner.findMany({
      include: dinnerInclude,
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = dinners.length > limit;
    const results = hasMore ? dinners.slice(0, limit) : dinners;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return NextResponse.json({
      dinners: results.map(serializeDinner),
      nextCursor,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = dinnerSchema.parse(await request.json());
    const startsAt = dateAndTimeToStartsAt(body.date, body.time);

    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError("Dinner date and time are invalid.");
    }

    const dinner = await prisma.dinner.create({
      data: {
        creatorId: user.id,
        restaurantName: body.restaurantName,
        address: body.address,
        city: body.city,
        cuisine: body.cuisine,
        dietary: body.dietary,
        budget: body.budget,
        maxGuests: body.maxGuests,
        startsAt,
        attendees: {
          create: {
            userId: user.id,
          },
        },
      },
      include: dinnerInclude,
    });

    return NextResponse.json({ dinner: serializeDinner(dinner) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
