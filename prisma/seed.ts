import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface SeedMessage {
  from: string;
  text: string;
  readBy: string[];
}

interface SeedDinner {
  id: string;
  creator: string;
  restaurantName: string;
  address: string;
  city: string;
  cuisine: string;
  dietary: string;
  budget: string;
  maxGuests: number;
  /** ISO date string for a fixed date */
  startsAt?: string;
  /** Relative date: days from now */
  daysFromNow?: number;
  /** Hour (UTC) to use with daysFromNow */
  hour?: number;
  attendees: string[];
  messages?: SeedMessage[];
}

interface SeedNotification {
  id: string;
  type: string;
  dinner: string;
  actor: string;
  recipient: string;
}

interface SeedReview {
  id: string;
  dinner: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  comment: string;
  isHostReview?: boolean;
}

interface SeedData {
  users: {
    email: string;
    name: string;
    username: string;
    city: string;
    dietary: string;
    bio: string;
  }[];
  dinners: SeedDinner[];
  notifications: SeedNotification[];
  reviews?: SeedReview[];
}

function resolveStartsAt(dinner: SeedDinner): Date {
  if (dinner.startsAt) {
    return new Date(dinner.startsAt);
  }
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + (dinner.daysFromNow ?? 0));
  date.setUTCHours(dinner.hour ?? 19, 0, 0, 0);
  return date;
}

async function main() {
  const dataPath = join(__dirname, "seed-data.json");
  const raw = readFileSync(dataPath, "utf-8").replace(/^\uFEFF/, "");
  const { users, dinners, notifications, reviews = [] }: SeedData = JSON.parse(raw);
  const dinnersById = new Map(dinners.map((dinner) => [dinner.id, dinner]));

  // Wipe all seed-generated data so re-running gives a clean slate
  await prisma.review.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.dinnerAttendee.deleteMany({});
  await prisma.dinner.deleteMany({});
  await prisma.user.deleteMany({});

  // Upsert users and build a username -> { id, name } map
  const userMap: Record<string, { id: string; name: string }> = {};
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: {
        ...user,
        passwordHash: "__clerk_seed__",
        avatarSeed: user.email,
      },
    });
    userMap[user.username] = { id: record.id, name: record.name };
  }

  // Upsert dinners
  const dinnerIdMap: Record<string, string> = {};
  for (const d of dinners) {
    const creatorId = userMap[d.creator].id;
    const record = await prisma.dinner.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        creatorId,
        restaurantName: d.restaurantName,
        address: d.address,
        city: d.city,
        cuisine: d.cuisine,
        dietary: d.dietary,
        budget: d.budget,
        maxGuests: d.maxGuests,
        startsAt: resolveStartsAt(d),
        attendees: {
          create: d.attendees.map((username) => ({
            userId: userMap[username].id,
          })),
        },
        ...(d.messages?.length
          ? {
              messages: {
                create: d.messages.map((m) => ({
                  userId: userMap[m.from].id,
                  text: m.text,
                  readByIds: m.readBy.map((u) => userMap[u].id),
                })),
              },
            }
          : {}),
      },
    });
    dinnerIdMap[d.id] = record.id;
  }

  // Upsert notifications
  for (const n of notifications) {
    const actor = userMap[n.actor];
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        type: n.type,
        dinnerId: dinnerIdMap[n.dinner],
        dinnerName: dinners.find((d) => d.id === n.dinner)!.restaurantName,
        actorId: actor.id,
        actorName: actor.name,
        recipientId: userMap[n.recipient].id,
      },
    });
  }

  // Upsert reviews
  for (const review of reviews) {
    const dinner = dinnersById.get(review.dinner);
    if (!dinner) {
      throw new Error(`Review references unknown dinner: ${review.dinner}`);
    }

    await prisma.review.upsert({
      where: { id: review.id },
      update: {
        rating: review.rating,
        comment: review.comment,
        revieweeId: userMap[review.reviewee].id,
        reviewerId: userMap[review.reviewer].id,
        dinnerId: dinnerIdMap[review.dinner],
        dinnerName: dinner.restaurantName,
        isHostReview: review.isHostReview ?? dinner.creator === review.reviewee,
      },
      create: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        revieweeId: userMap[review.reviewee].id,
        reviewerId: userMap[review.reviewer].id,
        dinnerId: dinnerIdMap[review.dinner],
        dinnerName: dinner.restaurantName,
        isHostReview: review.isHostReview ?? dinner.creator === review.reviewee,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
