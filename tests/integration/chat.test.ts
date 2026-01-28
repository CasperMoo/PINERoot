import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanDatabase, createTestUser } from '../helpers';

// Helper function to get auth token by logging in
async function getAuthToken(app: any, email: string, password: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email,
      password,
    },
  });

  const body = JSON.parse(response.body);
  return body.data.token;
}

describe('Chat API - 聊天模块集成测试', () => {
  let app: any;
  let adminToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    const { build } = await import('@/index');
    app = await build();

    // Create admin user and get token
    await createTestUser({
      email: 'admin@test.com',
      password: '123456',
      role: 'ADMIN',
    });
    adminToken = await getAuthToken(app, 'admin@test.com', '123456');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/chat/session', () => {
    it('should return null session for new user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/session',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.data.session).toBeNull();
    });
  });

  describe('GET /api/chat/models', () => {
    it('should return available models', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/models',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(Array.isArray(body.data.models)).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should reject non-admin users', async () => {
      // Create regular user
      await createTestUser({
        email: 'user@test.com',
        password: '123456',
        role: 'USER',
      });
      const userToken = await getAuthToken(app, 'user@test.com', '123456');

      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/session',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(4003); // Forbidden
    });
  });
});
