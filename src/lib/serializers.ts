import type { Prisma } from "@prisma/client";
import type { Comment, Dinner, Notification, Review } from "@/lib/data";
import type { User } from "@/contexts/AuthContext";
import { startsAtToDate, startsAtToTime } from "@/lib/time";

export const userSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  age: true,
  city: true,
  dietary: true,
  bio: true,
  avatarSeed: true,
} satisfies Prisma.UserSelect;

export const dinnerInclude = {
  creator: {
    select: {
      ...userSelect,
      reviewsReceived: {
        select: {
          rating: true,
        },
      },
    },
  },
  attendees: {
    include: {
      user: {
        select: userSelect,
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  },
  reviews: {
    select: {
      reviewerId: true,
      revieweeId: true,
    },
  },
} satisfies Prisma.DinnerInclude;

export const reviewInclude = {
  reviewer: {
    select: userSelect,
  },
  reviewee: {
    select: userSelect,
  },
} satisfies Prisma.ReviewInclude;

export const messageInclude = {
  user: {
    select: userSelect,
  },
} satisfies Prisma.MessageInclude;

export type AppUserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;
export type DinnerRecord = Prisma.DinnerGetPayload<{ include: typeof dinnerInclude }>;
export type ReviewRecord = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;
export type MessageRecord = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;
export type NotificationRecord = Prisma.NotificationGetPayload<{}>;

const avatarFor = (user: Pick<AppUserRecord, "avatarSeed" | "email">) =>
  `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(user.avatarSeed || user.email)}`;

export const serializeUser = (user: AppUserRecord): User => ({
  uid: user.id,
  email: user.email,
  name: user.name,
  username: user.username,
  age: user.age ?? undefined,
  city: user.city ?? undefined,
  dietary: user.dietary ?? undefined,
  bio: user.bio ?? undefined,
  avatarSeed: user.avatarSeed ?? user.email,
});

export const serializeDinner = (dinner: DinnerRecord): Dinner => {
  const hostReviews = dinner.creator.reviewsReceived;
  const reviews = dinner.reviews.reduce<Record<string, string[]>>((acc, review) => {
    acc[review.reviewerId] = [...(acc[review.reviewerId] || []), review.revieweeId];
    return acc;
  }, {});

  return {
    id: dinner.id,
    creatorId: dinner.creatorId,
    creatorName: dinner.creator.name,
    creatorUsername: dinner.creator.username,
    creatorImage: avatarFor(dinner.creator),
    hostReviewCount: hostReviews.length,
    hostAverageRating:
      hostReviews.length > 0
        ? hostReviews.reduce((total, review) => total + review.rating, 0) / hostReviews.length
        : 0,
    restaurantName: dinner.restaurantName,
    address: dinner.address,
    city: dinner.city,
    cuisine: dinner.cuisine,
    dietary: dinner.dietary as Dinner["dietary"],
    budget: dinner.budget as Dinner["budget"],
    maxGuests: dinner.maxGuests,
    filledSlots: dinner.attendees.length,
    bookedBy: dinner.attendees.map((attendee) => attendee.userId),
    attendees: dinner.attendees.map((attendee) => ({
      uid: attendee.userId,
      name: attendee.user.name,
      username: attendee.user.username,
      avatar: avatarFor(attendee.user),
    })),
    reviews,
    date: startsAtToDate(dinner.startsAt),
    time: startsAtToTime(dinner.startsAt),
    createdAt: dinner.createdAt.toISOString(),
  };
};

export const serializeReview = (review: ReviewRecord): Review => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  revieweeId: review.revieweeId,
  revieweeName: review.reviewee.name,
  revieweeUsername: review.reviewee.username,
  reviewerId: review.reviewerId,
  reviewerName: review.reviewer.username,
  reviewerImage: avatarFor(review.reviewer),
  dinnerId: review.dinnerId,
  dinnerName: review.dinnerName,
  isHostReview: review.isHostReview,
  createdAt: review.createdAt.toISOString(),
});

export const serializeMessage = (message: MessageRecord): Comment => ({
  id: message.id,
  text: message.text,
  userId: message.userId,
  userName: message.user.username,
  userImage: avatarFor(message.user),
  createdAt: message.createdAt.toISOString(),
  readBy: message.readByIds,
});

export const serializeNotification = (notification: NotificationRecord): Notification => ({
  id: notification.id,
  type: notification.type as Notification["type"],
  dinnerId: notification.dinnerId,
  dinnerName: notification.dinnerName,
  actorId: notification.actorId,
  actorName: notification.actorName,
  recipientId: notification.recipientId,
  read: notification.read,
  createdAt: notification.createdAt.toISOString(),
});
