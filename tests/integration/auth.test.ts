import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { build } from "@/index";
import { cleanDatabase, createTestUser } from "../helpers";

describe("Auth API - 认证模块集成测试", () => {
  let app: any;

  beforeEach(async () => {
    // 每个测试前清理数据库
    await cleanDatabase();
    // 创建Fastify实例
    app = await build();
  });

  afterEach(async () => {
    // 每个测试后关闭应用
    await app.close();
  });

  describe("POST /api/auth/register - 注册功能", () => {
    it("✅ 应该成功注册新用户", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "newuser@example.com",
          password: "123456",
          name: "New User",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("user");
      expect(body.data).toHaveProperty("token");
      expect(body.data.user.email).toBe("newuser@example.com");
      expect(body.data.user).not.toHaveProperty("password");
    });

    it("❌ 应该拒绝重复的邮箱", async () => {
      // 先创建一个用户
      await createTestUser({ email: "existing@example.com" });

      // 尝试用相同邮箱注册
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "existing@example.com",
          password: "123456",
          name: "Duplicate User",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });

    it("❌ 应该拒绝无效的邮箱格式", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "invalid-email",
          password: "123456",
          name: "Test",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });
  });

  describe("POST /api/auth/login - 登录功能", () => {
    it("✅ 应该成功登录", async () => {
      // 先创建用户
      await createTestUser({
        email: "login@example.com",
        password: "123456",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "login@example.com",
          password: "123456",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("token");
      expect(body.data.user.email).toBe("login@example.com");
    });

    it("❌ 应该拒绝错误的密码", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "123456",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });

    it("❌ 应该拒绝不存在的用户", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "nonexistent@example.com",
          password: "123456",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });
  });

  describe("GET /api/me - JWT验证", () => {
    it("✅ 应该返回当前用户信息", async () => {
      // 先注册获取token
      const registerRes = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "jwt@example.com",
          password: "123456",
          name: "JWT Test",
        },
      });

      const regBody = JSON.parse(registerRes.body);
      const { token } = regBody.data;

      // 使用token访问受保护接口
      const response = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.data.email).toBe("jwt@example.com");
    });

    it("❌ 应该拒绝无token的请求", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/me",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });

    it("❌ 应该拒绝无效的token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/me",
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBeGreaterThan(0);
    });
  });
});
