-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "age" INTEGER,
    "city" TEXT,
    "dietary" TEXT,
    "bio" TEXT,
    "avatarSeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dinner" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "dietary" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DinnerAttendee" (
    "dinnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DinnerAttendee_pkey" PRIMARY KEY ("dinnerId","userId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readByIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "dinnerName" TEXT NOT NULL,
    "isHostReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "dinnerName" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Dinner_creatorId_idx" ON "Dinner"("creatorId");

-- CreateIndex
CREATE INDEX "Dinner_startsAt_idx" ON "Dinner"("startsAt");

-- CreateIndex
CREATE INDEX "DinnerAttendee_userId_idx" ON "DinnerAttendee"("userId");

-- CreateIndex
CREATE INDEX "Message_dinnerId_createdAt_idx" ON "Message"("dinnerId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_dinnerId_idx" ON "Review"("dinnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_revieweeId_dinnerId_key" ON "Review"("reviewerId", "revieweeId", "dinnerId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_dinnerId_idx" ON "Notification"("dinnerId");

-- AddForeignKey
ALTER TABLE "Dinner" ADD CONSTRAINT "Dinner_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinnerAttendee" ADD CONSTRAINT "DinnerAttendee_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DinnerAttendee" ADD CONSTRAINT "DinnerAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
