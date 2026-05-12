# ForkFriends

ForkFriends is a Next.js app for hosting and joining shared dinner plans. Users can create dinners, book or cancel slots, chat with attendees, leave reviews after meals, and manage their profile.

## Current Stack

- Next.js 15 App Router
- React 18
- Tailwind CSS and shadcn-style UI components
- Auth.js Credentials provider for email/password sign-in
- Prisma ORM with Postgres
- Vercel-ready deployment setup

Firebase, Docker, and Prometheus have been removed from the current app.

## Environment

Create `.env.local` from `.env.example`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

For Vercel, connect a Postgres database from Vercel Marketplace or another compatible Postgres provider, then add `DATABASE_URL` and `AUTH_SECRET` in the project environment variables.

## Local Setup

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The seed creates demo users, including:

- `diner@example.com` / `password123`
- `host@example.com` / `password123`
- `vegan@example.com` / `password123`

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

- Sign up, sign in, and sign out with email/password.
- Create, edit, and delete dinners.
- Browse upcoming dinners with city, dietary, search, and date sorting filters.
- Book or cancel dinner slots with capacity checks.
- Use polling-based group chat for booked attendees and hosts.
- Leave reviews after a dinner has ended.
- View private profile, public profiles, activity stats, reviews, and booking notifications.
