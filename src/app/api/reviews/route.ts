import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireCurrentUser } from "@/lib/api-auth";
import { reviewInclude, serializeReview } from "@/lib/serializers";
import { reviewSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get("revieweeId");

    if (!revieweeId) {
      throw new ApiError("revieweeId is required.");
    }

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId,
      },
      include: reviewInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ reviews: reviews.map(serializeReview) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = reviewSchema.parse(await request.json());

    if (body.revieweeId === user.id) {
      throw new ApiError("You cannot review yourself.");
    }

    const dinner = await prisma.dinner.findUnique({
      where: { id: body.dinnerId },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!dinner) {
      throw new ApiError("Dinner not found.", 404);
    }

    if (dinner.startsAt > new Date()) {
      throw new ApiError("Reviews open after the dinner has ended.");
    }

    const reviewerAttended = dinner.attendees.some((attendee) => attendee.userId === user.id);
    const reviewee = dinner.attendees.find((attendee) => attendee.userId === body.revieweeId);

    if (!reviewerAttended || !reviewee) {
      throw new ApiError("Both people must have attended this dinner.", 403);
    }

    const review = await prisma.review.create({
      data: {
        rating: body.rating,
        comment: body.comment,
        revieweeId: body.revieweeId,
        reviewerId: user.id,
        dinnerId: dinner.id,
        dinnerName: dinner.restaurantName,
        isHostReview: dinner.creatorId === body.revieweeId,
      },
      include: reviewInclude,
    });

    return NextResponse.json({ review: serializeReview(review) }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(new ApiError("You have already reviewed this person for this dinner.", 409));
    }

    return jsonError(error);
  }
}
