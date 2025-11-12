import { FastifyRequest, FastifyReply } from 'fastify'
import { UserRole } from '@prisma/client'
import { error } from '../utils/response'

/**
 * 角色验证中间件工厂函数
 * @param allowedRoles 允许访问的角色列表
 * @returns Fastify preHandler 中间件
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 确保 authMiddleware 已经执行，currentUser 已挂载
    if (!request.currentUser) {
      return error(reply, 3001, 'Unauthorized: No token provided')
    }

    // 检查用户角色是否在允许列表中
    if (!allowedRoles.includes(request.currentUser.role)) {
      return error(reply, 4004, 'Forbidden: Insufficient permissions')
    }
  }
}

/**
 * 仅管理员可访问
 */
export function requireAdmin() {
  return requireRole(UserRole.ADMIN)
}

/**
 * 管理员或普通用户都可访问（任何已认证用户）
 */
export function requireUser() {
  return requireRole(UserRole.USER, UserRole.ADMIN)
}
