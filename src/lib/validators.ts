import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  age: z.coerce.number().int().min(13).max(120).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  dietary: z.string().trim().max(40).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarSeed: z.string().trim().max(160).nullable().optional(),
});

export const dinnerSchema = z.object({
  restaurantName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(180),
  city: z.string().trim().min(2).max(80),
  cuisine: z.string().trim().min(2).max(80),
  dietary: z.enum(["Veg", "Non-Veg", "Vegan"]),
  budget: z.enum(["$", "$$", "$$$", "$$$$"]),
  maxGuests: z.coerce.number().int().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export const reviewSchema = z.object({
  dinnerId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(500),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const uniqueUsernameFromEmail = (email: string) =>
  email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "newuser";
