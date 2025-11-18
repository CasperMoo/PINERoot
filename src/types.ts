import { FastifyRequest } from 'fastify'
import { UserRole } from '@prisma/client'

// 定义用户负载类型（不含密码）
export interface UserPayload {
  id: number
  email: string
  nickname: string | null
  role: UserRole
  createdAt: Date
}

// 使用 TypeScript 的声明合并来扩展 FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: UserPayload
  }
}
