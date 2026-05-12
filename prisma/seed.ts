import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const demoPassword = "password123";

const users = [
  {
    email: "diner@example.com",
    name: "Maya Singh",
    username: "maya",
    city: "Berlin",
    dietary: "Veg",
    bio: "Always looking for cozy spots, thoughtful conversation, and excellent dessert.",
  },
  {
    email: "host@example.com",
    name: "Jonas Weber",
    username: "jonas",
    city: "Munich",
    dietary: "Non-Veg",
    bio: "Weekend host, pasta enthusiast, and strong believer in sharing the good table.",
  },
  {
    email: "vegan@example.com",
    name: "Lea Fischer",
    username: "lea",
    city: "Hamburg",
    dietary: "Vegan",
    bio: "Plant-based food explorer. I keep a running map of great dumplings.",
  },
];

const nextDinnerDate = (daysFromNow: number, hour: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  const passwordHash = await hash(demoPassword, 12);

  const [maya, jonas, lea] = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: {
          ...user,
          passwordHash,
          avatarSeed: user.email,
        },
      })
    )
  );

  const dinner = await prisma.dinner.upsert({
    where: { id: "seed-berlin-noodles" },
    update: {},
    create: {
      id: "seed-berlin-noodles",
      creatorId: jonas.id,
      restaurantName: "Noodle House Mitte",
      address: "Rosenthaler Str. 12",
      city: "Berlin",
      cuisine: "Thai",
      dietary: "Veg",
      budget: "$$",
      maxGuests: 4,
      startsAt: nextDinnerDate(5, 18),
      attendees: {
        create: [
          { userId: jonas.id },
          { userId: maya.id },
        ],
      },
      messages: {
        create: [
          {
            userId: jonas.id,
            text: "I booked a table near the window. Looking forward to it!",
            readByIds: [jonas.id, maya.id],
          },
          {
            userId: maya.id,
            text: "Perfect, I will bring my appetite.",
            readByIds: [maya.id],
          },
        ],
      },
    },
  });

  await prisma.notification.upsert({
    where: {
      id: "seed-notification-booking",
    },
    update: {},
    create: {
      id: "seed-notification-booking",
      type: "booking",
      dinnerId: dinner.id,
      dinnerName: dinner.restaurantName,
      actorId: maya.id,
      actorName: maya.name,
      recipientId: jonas.id,
    },
  });

  await prisma.dinner.upsert({
    where: { id: "seed-hamburg-vegan" },
    update: {},
    create: {
      id: "seed-hamburg-vegan",
      creatorId: lea.id,
      restaurantName: "Green Spoon",
      address: "Marktstrasse 24",
      city: "Hamburg",
      cuisine: "Vegan Bowls",
      dietary: "Vegan",
      budget: "$$",
      maxGuests: 5,
      startsAt: nextDinnerDate(9, 19),
      attendees: {
        create: [{ userId: lea.id }],
      },
    },
  });
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
