# ForkFriends

ForkFriends is a Next.js app for hosting and joining shared dinner plans. Users can create dinners, book or cancel slots, chat with attendees, leave reviews after meals, and manage their profile.

## Current Stack

- Next.js 15 App Router
- React 18
- Tailwind CSS and shadcn-style UI components
- Clerk authentication
- Prisma ORM with Postgres
- Vercel-ready deployment setup

Firebase, Docker, and Prometheus have been removed from the current app.

## Environment

Create `.env.local` from `.env.example` and add your Clerk keys:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

For Vercel, connect a Postgres database from Vercel Marketplace or another compatible Postgres provider, then add these project environment variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
```

Use a production domain in your Clerk dashboard so production deployments use live keys instead of development keys.

After pointing production at a new database, apply the Prisma migrations once with:

```bash
npm run prisma:deploy
```

## Local Setup

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The seed creates demo data users by email. Sign in with Clerk using the same emails if you want those profiles mapped automatically.

Open `http://localhost:3000`.

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Core Flows

- Sign up, sign in, and sign out with Clerk.
- Create, edit, and delete dinners.
- Browse upcoming dinners with city, dietary, search, and date sorting filters.
- Book or cancel dinner slots with capacity checks.
- Use polling-based group chat for booked attendees and hosts.
- Leave reviews after a dinner has ended.
- View private profile, public profiles, activity stats, reviews, and booking notifications.
