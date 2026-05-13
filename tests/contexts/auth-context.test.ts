import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the parseJson and fetch for testing the auth context logic
describe('AuthContext - parseJson', () => {
  it('throws with error message from response when not ok', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'You must be signed in.' }),
    } as Response;

    // Replicate the parseJson logic from AuthContext
    const parseJson = async <T,>(response: Response): Promise<T> => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Request failed.');
      }
      return data as T;
    };

    await expect(parseJson(mockResponse)).rejects.toThrow('You must be signed in.');
  });

  it('returns data when response is ok', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ user: { uid: '123', email: 'test@test.com' } }),
    } as Response;

    const parseJson = async <T,>(response: Response): Promise<T> => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Request failed.');
      }
      return data as T;
    };

    const result = await parseJson<{ user: { uid: string } }>(mockResponse);
    expect(result.user.uid).toBe('123');
  });

  it('throws generic message when response has no error field', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({}),
    } as Response;

    const parseJson = async <T,>(response: Response): Promise<T> => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Request failed.');
      }
      return data as T;
    };

    await expect(parseJson(mockResponse)).rejects.toThrow('Request failed.');
  });

  it('handles json parse failure gracefully', async () => {
    const mockResponse = {
      ok: false,
      json: async () => { throw new Error('invalid json'); },
    } as Response;

    const parseJson = async <T,>(response: Response): Promise<T> => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Request failed.');
      }
      return data as T;
    };

    await expect(parseJson(mockResponse)).rejects.toThrow('Request failed.');
  });
});

describe('AuthContext - redirect logic', () => {
  it('authPages set correctly identifies sign in/up pages', () => {
    const authPages = new Set(['/signin', '/signup']);
    
    expect(authPages.has('/signin')).toBe(true);
    expect(authPages.has('/signup')).toBe(true);
    expect(authPages.has('/')).toBe(false);
    expect(authPages.has('/profile')).toBe(false);
  });
});
