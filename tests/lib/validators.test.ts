import { describe, it, expect } from 'vitest';
import { profileSchema, dinnerSchema, reviewSchema, messageSchema, uniqueUsernameFromEmail } from '@/lib/validators';

describe('profileSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileSchema.parse({
      name: 'John Doe',
      username: 'johndoe',
      age: 25,
      city: 'Berlin',
      dietary: 'Veg',
      bio: 'Hello world',
    });
    expect(result.name).toBe('John Doe');
    expect(result.username).toBe('johndoe');
    expect(result.age).toBe(25);
  });

  it('rejects age below 13', () => {
    expect(() => profileSchema.parse({ age: 12 })).toThrow();
  });

  it('rejects age above 120', () => {
    expect(() => profileSchema.parse({ age: 121 })).toThrow();
  });

  it('accepts age of 13', () => {
    const result = profileSchema.parse({ age: 13 });
    expect(result.age).toBe(13);
  });

  it('rejects username with special characters', () => {
    expect(() => profileSchema.parse({ username: 'john@doe' })).toThrow();
    expect(() => profileSchema.parse({ username: 'john doe' })).toThrow();
    expect(() => profileSchema.parse({ username: 'john-doe' })).toThrow();
  });

  it('accepts username with underscores', () => {
    const result = profileSchema.parse({ username: 'john_doe_123' });
    expect(result.username).toBe('john_doe_123');
  });

  it('rejects username shorter than 3 chars', () => {
    expect(() => profileSchema.parse({ username: 'ab' })).toThrow();
  });

  it('rejects name shorter than 2 chars', () => {
    expect(() => profileSchema.parse({ name: 'A' })).toThrow();
  });

  it('trims whitespace from string fields', () => {
    const result = profileSchema.parse({ name: '  John Doe  ', bio: '  hello  ' });
    expect(result.name).toBe('John Doe');
    expect(result.bio).toBe('hello');
  });

  it('allows null for optional nullable fields', () => {
    const result = profileSchema.parse({ age: null, city: null, dietary: null, bio: null });
    expect(result.age).toBeNull();
    expect(result.city).toBeNull();
  });

  it('allows all fields to be omitted', () => {
    const result = profileSchema.parse({});
    expect(result).toEqual({});
  });
});

describe('dinnerSchema', () => {
  const validDinner = {
    restaurantName: 'Noodle House',
    address: '123 Main Street',
    city: 'Berlin',
    cuisine: 'Thai',
    dietary: 'Veg' as const,
    budget: '$$' as const,
    maxGuests: 4,
    date: '2026-06-15',
    time: '19:00',
  };

  it('accepts valid dinner data', () => {
    const result = dinnerSchema.parse(validDinner);
    expect(result.restaurantName).toBe('Noodle House');
    expect(result.maxGuests).toBe(4);
  });

  it('rejects invalid dietary option', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, dietary: 'Keto' })).toThrow();
  });

  it('rejects invalid budget option', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, budget: '$$$$$' })).toThrow();
  });

  it('rejects maxGuests below 1', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, maxGuests: 0 })).toThrow();
  });

  it('rejects maxGuests above 20', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, maxGuests: 21 })).toThrow();
  });

  it('rejects invalid date format', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, date: '15-06-2026' })).toThrow();
    expect(() => dinnerSchema.parse({ ...validDinner, date: '2026/06/15' })).toThrow();
  });

  it('rejects invalid time format', () => {
    expect(() => dinnerSchema.parse({ ...validDinner, time: '25:00' })).toThrow();
    expect(() => dinnerSchema.parse({ ...validDinner, time: '7pm' })).toThrow();
  });

  it('accepts edge valid times', () => {
    expect(dinnerSchema.parse({ ...validDinner, time: '0:00' }).time).toBe('0:00');
    expect(dinnerSchema.parse({ ...validDinner, time: '23:59' }).time).toBe('23:59');
  });
});

describe('reviewSchema', () => {
  it('accepts valid review', () => {
    const result = reviewSchema.parse({
      dinnerId: 'dinner123',
      revieweeId: 'user456',
      rating: 4,
      comment: 'Great dinner party, wonderful host!',
    });
    expect(result.rating).toBe(4);
  });

  it('rejects rating below 1', () => {
    expect(() => reviewSchema.parse({
      dinnerId: 'dinner123',
      revieweeId: 'user456',
      rating: 0,
      comment: 'Some comment text here',
    })).toThrow();
  });

  it('rejects rating above 5', () => {
    expect(() => reviewSchema.parse({
      dinnerId: 'dinner123',
      revieweeId: 'user456',
      rating: 6,
      comment: 'Some comment text here',
    })).toThrow();
  });

  it('rejects comment shorter than 10 chars', () => {
    expect(() => reviewSchema.parse({
      dinnerId: 'dinner123',
      revieweeId: 'user456',
      rating: 3,
      comment: 'Short',
    })).toThrow();
  });

  it('rejects empty dinnerId', () => {
    expect(() => reviewSchema.parse({
      dinnerId: '',
      revieweeId: 'user456',
      rating: 3,
      comment: 'Some valid comment here',
    })).toThrow();
  });
});

describe('messageSchema', () => {
  it('accepts valid message', () => {
    const result = messageSchema.parse({ text: 'Hello everyone!' });
    expect(result.text).toBe('Hello everyone!');
  });

  it('rejects empty message', () => {
    expect(() => messageSchema.parse({ text: '' })).toThrow();
  });

  it('rejects whitespace-only message', () => {
    expect(() => messageSchema.parse({ text: '   ' })).toThrow();
  });

  it('trims message text', () => {
    const result = messageSchema.parse({ text: '  Hello!  ' });
    expect(result.text).toBe('Hello!');
  });
});

describe('uniqueUsernameFromEmail', () => {
  it('extracts username from email', () => {
    expect(uniqueUsernameFromEmail('john.doe@example.com')).toBe('johndoe');
  });

  it('removes special characters', () => {
    expect(uniqueUsernameFromEmail('user+tag@example.com')).toBe('usertag');
  });

  it('converts to lowercase', () => {
    expect(uniqueUsernameFromEmail('JohnDoe@example.com')).toBe('johndoe');
  });

  it('returns newuser for empty local part', () => {
    expect(uniqueUsernameFromEmail('@example.com')).toBe('newuser');
  });

  it('handles email with only special chars in local part', () => {
    expect(uniqueUsernameFromEmail('+++@example.com')).toBe('newuser');
  });
});
