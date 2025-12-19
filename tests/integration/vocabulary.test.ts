import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanDatabase, createTestUser } from "../helpers";

describe("Vocabulary API - 单词本模块集成测试", () => {
  let app: any;
  let authToken: string;
  let testUserId: number;

  beforeEach(async () => {
    // 每个测试前清理数据库
    await cleanDatabase();
    // 延迟导入 build 函数，确保使用正确的 DATABASE_URL
    const { build } = await import("@/index");
    // 创建Fastify实例
    app = await build();

    // 创建测试用户并获取token
    const user = await createTestUser({ email: "vocab@example.com" });
    testUserId = user.id;

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "vocab@example.com",
        password: "123456",
      },
    });

    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.data.token;
  });

  afterEach(async () => {
    // 每个测试后关闭应用
    await app.close();
  });

  describe("POST /api/vocabulary/translate - 翻译查询单词", () => {
    it("✅ 应该成功翻译中文单词", async () => {
      // Mock the AI workflow service to avoid import issues
      const originalAiWorkflow = app.aiWorkflow;
      app.aiWorkflow = {
        executeAndCollect: async (workflow: string, params: any) => {
          // Mock translation response
          return JSON.stringify([
            {
              kanji: "苹果",
              kana: "りんご",
              meaning: "苹果",
              pos: { type: "名詞" },
              frequency: 5,
              pitch: 0,
              example: "りんごを食べます",
              note: "常见水果",
              synonyms: [
                { word: "林檎", diff: "更正式的写法" }
              ]
            }
          ]);
        }
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/translate",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          text: "苹果",
        },
      });

      // Restore original AI workflow
      app.aiWorkflow = originalAiWorkflow;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("wordId");
      expect(body.data).toHaveProperty("originalText", "苹果");
      expect(body.data).toHaveProperty("language", "CHINESE");
      expect(body.data).toHaveProperty("fromCache", false);
      expect(body.data).toHaveProperty("translation");
      expect(Array.isArray(body.data.translation)).toBe(true);
      expect(body.data.translation[0]).toHaveProperty("kanji", "苹果");
      expect(body.data).toHaveProperty("isCollected", false);
    });

    it("✅ 应该成功翻译日文单词", async () => {
      // Mock the AI workflow service
      const originalAiWorkflow = app.aiWorkflow;
      app.aiWorkflow = {
        executeAndCollect: async (workflow: string, params: any) => {
          return JSON.stringify([
            {
              kanji: "猫",
              kana: "ねこ",
              meaning: "猫",
              pos: { type: "名詞" },
              frequency: 5,
              pitch: 1,
              example: "猫が可愛いです",
              note: "常见宠物",
              synonyms: [
                { word: "ネコ", diff: "片假名写法" }
              ]
            }
          ]);
        }
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/translate",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          text: "猫",
        },
      });

      // Restore original AI workflow
      app.aiWorkflow = originalAiWorkflow;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.data.language).toBe("JAPANESE");
      expect(body.data.originalText).toBe("猫");
    });

    it("❌ 应该拒绝空的输入", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/translate",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          text: "",
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("❌ 应该拒绝过长的输入", async () => {
      const longText = "a".repeat(501);
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/translate",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          text: longText,
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("❌ 应该拒绝未认证的请求", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/translate",
        payload: {
          text: "测试",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /api/vocabulary/collect - 收藏单词", () => {
    let wordId: number;

    beforeEach(async () => {
      // 先创建一个单词记录
      const word = await app.prisma.wordLibrary.create({
        data: {
          originalText: "测试",
          language: "CHINESE",
          translationData: [
            {
              kanji: "测试",
              kana: "テスト",
              meaning: "test",
              pos: { type: "名詞" },
              frequency: 3,
              pitch: 0,
              example: "テストを行う",
              note: "测试",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });
      wordId = word.id;
    });

    it("✅ 应该成功收藏单词", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          wordId,
          note: "这是我收藏的单词",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("id");
      expect(body.data).toHaveProperty("wordId", wordId);
      expect(body.data).toHaveProperty("createdAt");
    });

    it("✅ 应该允许收藏不带笔记的单词", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          wordId,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it("❌ 应该拒绝重复收藏", async () => {
      // 先收藏一次
      await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          wordId,
        },
      });

      // 再次收藏
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          wordId,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("已收藏");
    });

    it("❌ 应该拒绝无效的单词ID", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          wordId: 999999,
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("❌ 应该拒绝未认证的请求", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/vocabulary/collect",
        payload: {
          wordId,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/vocabulary/my-words - 获取我的单词本", () => {
    let wordId1: number;
    let wordId2: number;

    beforeEach(async () => {
      // 创建两个单词
      const word1 = await app.prisma.wordLibrary.create({
        data: {
          originalText: "単語1",
          language: "JAPANESE",
          translationData: [
            {
              kanji: "単語",
              kana: "たんご",
              meaning: "单词",
              pos: { type: "名詞" },
              frequency: 5,
              pitch: 0,
              example: "新しい単語を覚える",
              note: "词汇",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });
      wordId1 = word1.id;

      const word2 = await app.prisma.wordLibrary.create({
        data: {
          originalText: "単語2",
          language: "JAPANESE",
          translationData: [
            {
              kanji: "単語",
              kana: "たんご",
              meaning: "单词",
              pos: { type: "名詞" },
              frequency: 4,
              pitch: 0,
              example: "単語を調べる",
              note: "词汇",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });
      wordId2 = word2.id;

      // 收藏第一个单词
      await app.prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          wordId: wordId1,
          note: "第一个单词",
          status: "NEW",
        },
      });

      // 收藏第二个单词（学习中）
      await app.prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          wordId: wordId2,
          note: "第二个单词",
          status: "LEARNING",
        },
      });
    });

    it("✅ 应该成功获取单词本列表", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/vocabulary/my-words",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("total", 2);
      expect(body.data).toHaveProperty("page", 1);
      expect(body.data).toHaveProperty("pageSize", 20);
      expect(body.data).toHaveProperty("items");
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBe(2);
    });

    it("✅ 应该支持分页", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/vocabulary/my-words?page=1&pageSize=1",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.total).toBe(2);
      expect(body.data.items.length).toBe(1);
    });

    it("✅ 应该支持按状态筛选", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/vocabulary/my-words?status=LEARNING",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.total).toBe(1);
      expect(body.data.items[0].status).toBe("LEARNING");
    });

    it("❌ 应该拒绝未认证的请求", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/vocabulary/my-words",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/vocabulary/my-words/:id - 更新单词状态和笔记", () => {
    let vocabId: number;

    beforeEach(async () => {
      // 创建单词并收藏
      const word = await app.prisma.wordLibrary.create({
        data: {
          originalText: "更新",
          language: "CHINESE",
          translationData: [
            {
              kanji: "更新",
              kana: "こうしん",
              meaning: "更新",
              pos: { type: "名詞" },
              frequency: 4,
              pitch: 0,
              example: "システムを更新する",
              note: "更新",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });

      const vocab = await app.prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          wordId: word.id,
          status: "NEW",
        },
      });
      vocabId = vocab.id;
    });

    it("✅ 应该成功更新单词状态", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: `/api/vocabulary/my-words/${vocabId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          status: "MASTERED",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.message).toContain("更新成功");
    });

    it("✅ 应该成功更新单词笔记", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: `/api/vocabulary/my-words/${vocabId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          note: "新的笔记内容",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it("✅ 应该同时更新状态和笔记", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: `/api/vocabulary/my-words/${vocabId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          status: "LEARNING",
          note: "学习中的单词",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it("❌ 应该拒绝更新其他用户的单词", async () => {
      // 创建另一个用户
      const otherUser = await createTestUser({ email: "other@example.com" });

      // 创建其他用户的单词
      const otherWord = await app.prisma.wordLibrary.create({
        data: {
          originalText: "其他",
          language: "CHINESE",
          translationData: [
            {
              kanji: "其他",
              kana: "そのた",
              meaning: "其他",
              pos: { type: "名詞" },
              frequency: 3,
              pitch: 0,
              example: "その他の質問",
              note: "其他",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });

      const otherVocab = await app.prisma.userVocabulary.create({
        data: {
          userId: otherUser.id,
          wordId: otherWord.id,
          status: "NEW",
        },
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/api/vocabulary/my-words/${otherVocab.id}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          status: "MASTERED",
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("❌ 应该拒绝未认证的请求", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: `/api/vocabulary/my-words/${vocabId}`,
        payload: {
          status: "MASTERED",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("DELETE /api/vocabulary/my-words/:id - 从单词本移除单词", () => {
    let vocabId: number;

    beforeEach(async () => {
      // 创建单词并收藏
      const word = await app.prisma.wordLibrary.create({
        data: {
          originalText: "削除",
          language: "JAPANESE",
          translationData: [
            {
              kanji: "削除",
              kana: "さくじょ",
              meaning: "删除",
              pos: { type: "名詞" },
              frequency: 3,
              pitch: 0,
              example: "データを削除する",
              note: "删除",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });

      const vocab = await app.prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          wordId: word.id,
          status: "NEW",
        },
      });
      vocabId = vocab.id;
    });

    it("✅ 应该成功移除单词", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/api/vocabulary/my-words/${vocabId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Accept-Language': 'zh-CN',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.message).toContain("已移除");
    });

    it("❌ 应该拒绝删除其他用户的单词", async () => {
      // 创建另一个用户
      const otherUser = await createTestUser({ email: "other2@example.com" });

      // 创建其他用户的单词
      const otherWord = await app.prisma.wordLibrary.create({
        data: {
          originalText: "他人",
          language: "JAPANESE",
          translationData: [
            {
              kanji: "他人",
              kana: "たにん",
              meaning: "他人",
              pos: { type: "名詞" },
              frequency: 3,
              pitch: 0,
              example: "他人の事",
              note: "他人",
              synonyms: []
            }
          ],
          queryCount: 1,
        },
      });

      const otherVocab = await app.prisma.userVocabulary.create({
        data: {
          userId: otherUser.id,
          wordId: otherWord.id,
          status: "NEW",
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/api/vocabulary/my-words/${otherVocab.id}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("❌ 应该拒绝删除不存在的单词", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/vocabulary/my-words/999999",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("❌ 应该拒绝未认证的请求", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/api/vocabulary/my-words/${vocabId}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});