import { FastifyRequest } from 'fastify'
import { UserRole, PrismaClient } from '@prisma/client'
import { AIWorkflowService } from './modules/ai-workflow'
import { LLMProviderService } from './modules/llm-provider'

// 定义用户负载类型（不含密码）
export interface UserPayload {
  id: number
  email: string
  nickname: string | null
  role: UserRole
  createdAt: Date
}

// 翻译函数类型
export type TranslateFunction = (key: string, defaultValue?: string) => string

// 使用 TypeScript 的声明合并来扩展 FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: UserPayload
    // i18n support
    t: TranslateFunction
  }

  interface FastifyInstance {
    prisma: PrismaClient
    aiWorkflow: AIWorkflowService
    llm: LLMProviderService
  }
}
