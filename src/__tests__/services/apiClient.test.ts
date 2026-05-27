import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, authApi, petsApi, healthRecordsApi, remindersApi, manualsApi, aiApi } from '@/lib/api';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    api.clearToken();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    api.clearToken();
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should set and get token correctly', () => {
      const testToken = 'test-token-123';
      api.setToken(testToken);
      expect(api.getToken()).toBe(testToken);
      expect(localStorage.getItem('auth_token')).toBe(testToken);
    });

    it('should retrieve token from localStorage on init', () => {
      localStorage.setItem('auth_token', 'stored-token');
      expect(api.getToken()).toBe('stored-token');
    });

    it('should clear token and localStorage', () => {
      api.setToken('test-token');
      api.clearToken();
      expect(api.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Request Methods', () => {
    it('should make GET request with authorization header when token exists', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      api.setToken('test-token');
      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should make POST request with JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const testData = { name: 'test', value: 123 };
      await api.post('/test', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
        })
      );
    });

    it('should make PUT request with JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const testData = { name: 'updated' };
      await api.put('/test/1', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      );
    });

    it('should make DELETE request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw error when response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/test')).rejects.toThrow('Unauthorized');
    });

    it('should throw HTTP status error when no JSON error is available', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Parse error')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/test')).rejects.toThrow('HTTP 500');
    });
  });

  describe('Security Tests', () => {
    it('should not include Authorization header when no token exists', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      api.clearToken();
      await api.get('/test');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('should handle token expiration gracefully', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: vi.fn().mockResolvedValue({ error: 'Token expired' }),
        });
      vi.stubGlobal('fetch', mockFetch);

      api.setToken('expired-token');
      await expect(api.get('/test')).rejects.toThrow('Token expired');
    });
  });

  describe('API Module Exports', () => {
    it('should export authApi with all methods', () => {
      expect(authApi.register).toBeDefined();
      expect(authApi.login).toBeDefined();
      expect(authApi.getMe).toBeDefined();
      expect(authApi.updateMe).toBeDefined();
    });

    it('should export petsApi with all methods', () => {
      expect(petsApi.getAll).toBeDefined();
      expect(petsApi.create).toBeDefined();
      expect(petsApi.getById).toBeDefined();
      expect(petsApi.update).toBeDefined();
      expect(petsApi.delete).toBeDefined();
      expect(petsApi.getVaccines).toBeDefined();
      expect(petsApi.addVaccine).toBeDefined();
      expect(petsApi.getCheckups).toBeDefined();
      expect(petsApi.addCheckup).toBeDefined();
      expect(petsApi.getGrowth).toBeDefined();
      expect(petsApi.addGrowth).toBeDefined();
    });

    it('should export healthRecordsApi with all methods', () => {
      expect(healthRecordsApi.getAll).toBeDefined();
      expect(healthRecordsApi.search).toBeDefined();
      expect(healthRecordsApi.create).toBeDefined();
      expect(healthRecordsApi.getById).toBeDefined();
      expect(healthRecordsApi.update).toBeDefined();
      expect(healthRecordsApi.delete).toBeDefined();
    });

    it('should export remindersApi with all methods', () => {
      expect(remindersApi.getAll).toBeDefined();
      expect(remindersApi.getUpcoming).toBeDefined();
      expect(remindersApi.create).toBeDefined();
      expect(remindersApi.getById).toBeDefined();
      expect(remindersApi.update).toBeDefined();
      expect(remindersApi.delete).toBeDefined();
      expect(remindersApi.complete).toBeDefined();
    });

    it('should export manualsApi with all methods', () => {
      expect(manualsApi.getAll).toBeDefined();
      expect(manualsApi.search).toBeDefined();
      expect(manualsApi.getById).toBeDefined();
      expect(manualsApi.getBookmarks).toBeDefined();
      expect(manualsApi.addBookmark).toBeDefined();
      expect(manualsApi.removeBookmark).toBeDefined();
    });

    it('should export aiApi with all methods', () => {
      expect(aiApi.chat).toBeDefined();
      expect(aiApi.getConversation).toBeDefined();
      expect(aiApi.generateReport).toBeDefined();
    });
  });

  describe('Query String Building', () => {
    it('should build query string correctly for health records', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ records: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await healthRecordsApi.getAll({ petId: '1', type: 'TEXT', important: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('petId=1'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=TEXT'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('important=true'),
        expect.anything()
      );
    });

    it('should build query string correctly for reminders', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ reminders: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await remindersApi.getAll({ petId: '1', type: 'VACCINE', completed: false });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('petId=1'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=VACCINE'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('completed=false'),
        expect.anything()
      );
    });
  });
});