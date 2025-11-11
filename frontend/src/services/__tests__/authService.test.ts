/**
 * Frontend unit tests for authService functions using Jest + jsdom.
 * We mock buildPath and fetch to isolate HTTP behavior.
 */
import { loginUser, registerUser } from '../authService';

// Mock buildPath to avoid relying on import.meta.env
jest.mock('../buildPath', () => ({
  buildPath: (route: string) => `http://api.test/${route}`,
}));

describe('authService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as any;
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch as any;
  });

  describe('loginUser', () => {
    it('succeeds and stores user_data in localStorage', async () => {
      const fakeResponse = {
        id: 42,
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'student',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        text: async () => JSON.stringify(fakeResponse),
      });

      const user = await loginUser('ada@example.com', 'secret');

      expect(user).toEqual({
        firstName: 'Ada',
        lastName: 'Lovelace',
        id: 42,
        role: 'student',
      });

      const stored = localStorage.getItem('user_data');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toEqual(user);

      // Ensure request shape
      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.test/api/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('throws on invalid credentials (id <= 0)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: async () => JSON.stringify({ id: -1, error: 'Invalid credentials' }),
      });

      await expect(loginUser('bad@example.com', 'wrong'))
        .rejects.toThrow('User/Password combination incorrect');

      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('supports snake_case names from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: async () => JSON.stringify({ id: 7, first_name: 'Grace', last_name: 'Hopper' }),
      });

      const user = await loginUser('grace@example.com', 'pwd');
      expect(user).toEqual({ firstName: 'Grace', lastName: 'Hopper', id: 7, role: 'student' });
    });
  });

  describe('registerUser', () => {
    it('returns response on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: async () => JSON.stringify({ error: '' }),
      });

      const res = await registerUser('new@user.com', 'pw', 'New', 'User', '99', 'student');
      expect(res).toEqual({ error: '' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.test/api/register',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws with server-provided error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: async () => JSON.stringify({ error: 'Email already exists' }),
      });

      await expect(
        registerUser('dup@user.com', 'pw', 'Dup', 'User', '100', 'student')
      ).rejects.toThrow('Email already exists');
    });
  });
});
