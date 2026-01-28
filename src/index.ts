import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { config } from './config'
import { prisma } from './db'
import authRoutes from './routes/auth'
import imageRoutes from './routes/image'
import imageTagRoutes from './routes/imageTag'
import activityConfigRoutes from './routes/activityConfig'
import halloweenRoutes from './routes/anchor/halloween'
import reminderRoutes from './routes/reminder'
import vocabularyRoutes from './routes/vocabulary'
import personaRoutes from './routes/persona'
import { authMiddleware } from './middleware/auth'
import './types'
import { ok, error } from "./utils/response";
import { parseAcceptLanguage, createTranslator } from './utils/i18n'
import { initAIWorkflowModule } from './modules/ai-workflow'
import { initLLMProviderModule } from './modules/llm-provider/llm-provider.module'
import { initMemoryModule } from './modules/memory/memory.module'
import testAIWorkflowRoutes from './routes/test-ai-workflow'

// 导出build函数供测试使用
export async function build() {
  const app = fastify({ logger: true });

  // Register CORS plugin
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Register JWT plugin
  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // Register multipart plugin for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
      files: 10 // Max 10 files per request
    }
  });

  // Decorate prisma instance
  app.decorate('prisma', prisma);

  // Add i18n support - detect language and inject translator
  app.addHook('onRequest', async (request, reply) => {
    // 1. 尝试从 query parameter 获取语言
    const queryLang = request.query as any
    let lang = queryLang?.lang

    // 2. 如果没有 query parameter，从 Accept-Language header 获取
    if (!lang) {
      lang = parseAcceptLanguage(request.headers['accept-language'])
    }

    // 3. 创建翻译函数并注入到 request
    request.t = createTranslator(lang)
  });

  // Health check endpoint
  app.get("/health", async (request, reply) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return ok(reply, {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (err) {
      return error(reply, 9001, "Service Unavailable", 200, {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }
  });

  // Register auth routes
  await app.register(authRoutes, { prefix: "/api/auth" });

  // Register image routes
  await app.register(imageRoutes, { prefix: "/api" });

  // Register image tag routes
  await app.register(imageTagRoutes, { prefix: "/api" });

  // Register activity config routes
  await app.register(activityConfigRoutes, { prefix: "/api" });

  // Register Halloween anchor routes
  await app.register(halloweenRoutes, { prefix: "/api" });

  // Register reminder routes
  await app.register(reminderRoutes, { prefix: "/api" });

  // Register persona routes
  await app.register(personaRoutes, { prefix: "/api" });

  // Initialize AI Workflow module
  const aiWorkflowModule = await initAIWorkflowModule(app, prisma);
  app.decorate('aiWorkflow', aiWorkflowModule.service);
  await app.register(testAIWorkflowRoutes, { prefix: "/api" });

  // Initialize LLM Provider module
  const llmProviderModule = await initLLMProviderModule(app);
  app.decorate('llm', llmProviderModule.service);

  // Initialize Memory module
  const memoryModule = await initMemoryModule(app);
  app.decorate('memory', memoryModule.service);

  // Register vocabulary routes (must be after AI Workflow initialization)
  await app.register(vocabularyRoutes, { prefix: "/api" });

  // Protected route - Get current user
  app.get(
    "/api/me",
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      return ok(reply, request.currentUser);
    }
  );

  return app;
}

// 只有直接运行时才启动服务器
async function start() {
  try {
    const app = await build();

    // Start server
    await app.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    console.log(`Server listening on http://0.0.0.0:${config.PORT}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, closing server gracefully...`);

      try {
        await app.close();
        await prisma.$disconnect();
        console.log("Server closed successfully");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// 只有作为主模块运行时才启动服务器
if (require.main === module) {
  start();
}
