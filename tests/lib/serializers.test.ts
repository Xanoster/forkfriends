import { describe, it, expect } from 'vitest';
import { serializeUser } from '@/lib/serializers';

describe('serializeUser', () => {
  it('maps database user to frontend User shape', () => {
    const dbUser = {
      id: 'cluser123',
      email: 'john@example.com',
      name: 'John Doe',
      username: 'johndoe',
      age: 28,
      city: 'Berlin',
      dietary: 'Veg',
      bio: 'Hello!',
      avatarSeed: 'custom-seed',
    };

    const result = serializeUser(dbUser);

    expect(result).toEqual({
      uid: 'cluser123',
      email: 'john@example.com',
      name: 'John Doe',
      username: 'johndoe',
      age: 28,
      city: 'Berlin',
      dietary: 'Veg',
      bio: 'Hello!',
      avatarSeed: 'custom-seed',
    });
  });

  it('maps id to uid', () => {
    const dbUser = {
      id: 'abc123',
      email: 'test@test.com',
      name: 'Test',
      username: 'test',
      age: null,
      city: null,
      dietary: null,
      bio: null,
      avatarSeed: null,
    };

    const result = serializeUser(dbUser);
    expect(result.uid).toBe('abc123');
  });

  it('converts null optional fields to undefined', () => {
    const dbUser = {
      id: 'abc123',
      email: 'test@test.com',
      name: 'Test',
      username: 'test',
      age: null,
      city: null,
      dietary: null,
      bio: null,
      avatarSeed: null,
    };

    const result = serializeUser(dbUser);
    expect(result.age).toBeUndefined();
    expect(result.city).toBeUndefined();
    expect(result.dietary).toBeUndefined();
    expect(result.bio).toBeUndefined();
  });

  it('uses email as avatarSeed fallback when avatarSeed is null', () => {
    const dbUser = {
      id: 'abc123',
      email: 'test@test.com',
      name: 'Test',
      username: 'test',
      age: null,
      city: null,
      dietary: null,
      bio: null,
      avatarSeed: null,
    };

    const result = serializeUser(dbUser);
    expect(result.avatarSeed).toBe('test@test.com');
  });

  it('preserves avatarSeed when set', () => {
    const dbUser = {
      id: 'abc123',
      email: 'test@test.com',
      name: 'Test',
      username: 'test',
      age: 30,
      city: 'Munich',
      dietary: 'Vegan',
      bio: 'Bio text',
      avatarSeed: 'my-seed',
    };

    const result = serializeUser(dbUser);
    expect(result.avatarSeed).toBe('my-seed');
  });
});
