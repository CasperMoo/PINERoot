import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin, requireUser } from '../middleware/roleAuth'
import { ok, error, ErrorCode } from '../utils/response'
import { prisma } from '../db'
import { Prisma } from '@prisma/client'

interface CreateActivityConfigBody {
  activityId: string
  config: Record<string, unknown>
}

interface UpdateActivityConfigBody {
  config: Record<string, unknown>
}

interface RollbackBody {
  version: number
}

interface ActivityIdParams {
  activityId: string
}

/**
 * 活动配置路由
 */
export default async function activityConfigRoutes(fastify: FastifyInstance) {
  /**
   * 获取所有活动的最新配置列表（所有认证用户可访问）
   */
  fastify.get(
    '/activity-configs',
    { preHandler: [authMiddleware, requireUser()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 查询所有未删除的配置，按 activityId 分组取最新版本
        const configs = await prisma.$queryRaw<Array<{
          id: number
          activityId: string
          config: string
          version: number
          createdAt: Date
          updatedAt: Date
        }>>`
          SELECT ac1.*
          FROM ActivityConfig ac1
          INNER JOIN (
            SELECT activityId, MAX(version) as maxVersion
            FROM ActivityConfig
            WHERE deletedAt IS NULL
            GROUP BY activityId
          ) ac2 ON ac1.activityId = ac2.activityId AND ac1.version = ac2.maxVersion
          WHERE ac1.deletedAt IS NULL
          ORDER BY ac1.updatedAt DESC
        `

        // 解析 JSON 字符串为对象
        const formattedConfigs = configs.map(config => ({
          id: config.id,
          activityId: config.activityId,
          config: typeof config.config === 'string' ? JSON.parse(config.config) : config.config,
          version: config.version,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }))

        return ok(reply, formattedConfigs)
      } catch (err) {
        console.error('Get activity configs error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取活动配置列表失败', 500)
      }
    }
  )

  /**
   * 获取指定活动的最新配置（所有认证用户可访问）
   */
  fastify.get<{ Params: ActivityIdParams }>(
    '/activity-configs/:activityId',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const { activityId } = request.params

        // 查询最新未删除的配置
        const config = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            deletedAt: null
          },
          orderBy: {
            version: 'desc'
          }
        })

        if (!config) {
          return error(reply, ErrorCode.ACTIVITY_CONFIG_NOT_FOUND, '活动配置不存在')
        }

        return ok(reply, config)
      } catch (err) {
        console.error('Get activity config error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取活动配置失败', 500)
      }
    }
  )

  /**
   * 获取指定活动的所有历史版本（所有认证用户可访问）
   */
  fastify.get<{ Params: ActivityIdParams }>(
    '/activity-configs/:activityId/history',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const { activityId } = request.params

        // 查询所有版本（包括已删除）
        const configs = await prisma.activityConfig.findMany({
          where: {
            activityId
          },
          orderBy: {
            version: 'desc'
          }
        })

        if (configs.length === 0) {
          return error(reply, ErrorCode.ACTIVITY_CONFIG_NOT_FOUND, '活动配置不存在')
        }

        return ok(reply, configs)
      } catch (err) {
        console.error('Get activity config history error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取活动配置历史失败', 500)
      }
    }
  )

  /**
   * 创建新活动配置（仅管理员）
   */
  fastify.post<{ Body: CreateActivityConfigBody }>(
    '/activity-configs',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request, reply) => {
      try {
        const { activityId, config } = request.body

        // 参数校验
        if (!activityId) {
          return error(reply, ErrorCode.ACTIVITY_ID_REQUIRED, 'activityId 必填')
        }

        if (!config || typeof config !== 'object') {
          return error(reply, ErrorCode.INVALID_CONFIG_FORMAT, 'config 必须是有效的 JSON 对象')
        }

        // 检查活动ID是否已存在（未删除的配置）
        const existing = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            deletedAt: null
          }
        })

        if (existing) {
          return error(reply, ErrorCode.ACTIVITY_ID_EXISTS, '活动ID已存在')
        }

        // 创建新配置（version = 1）
        const newConfig = await prisma.activityConfig.create({
          data: {
            activityId,
            config: config as Prisma.InputJsonValue,
            version: 1
          }
        })

        return ok(reply, newConfig, '创建成功')
      } catch (err) {
        console.error('Create activity config error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '创建活动配置失败', 500)
      }
    }
  )

  /**
   * 更新活动配置（软删除旧版本 + 新增记录，仅管理员）
   */
  fastify.patch<{ Params: ActivityIdParams; Body: UpdateActivityConfigBody }>(
    '/activity-configs/:activityId',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request, reply) => {
      try {
        const { activityId } = request.params
        const { config } = request.body

        // 参数校验
        if (!config || typeof config !== 'object') {
          return error(reply, ErrorCode.INVALID_CONFIG_FORMAT, 'config 必须是有效的 JSON 对象')
        }

        // 查找当前生效的配置
        const currentConfig = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            deletedAt: null
          },
          orderBy: {
            version: 'desc'
          }
        })

        if (!currentConfig) {
          return error(reply, ErrorCode.ACTIVITY_CONFIG_NOT_FOUND, '活动配置不存在')
        }

        // 使用事务：软删除旧版本 + 创建新版本
        const newConfig = await prisma.$transaction(async (tx) => {
          // 1. 软删除旧版本
          await tx.activityConfig.update({
            where: { id: currentConfig.id },
            data: { deletedAt: new Date() }
          })

          // 2. 创建新版本
          return tx.activityConfig.create({
            data: {
              activityId,
              config: config as Prisma.InputJsonValue,
              version: currentConfig.version + 1
            }
          })
        })

        return ok(reply, newConfig, '更新成功')
      } catch (err) {
        console.error('Update activity config error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '更新活动配置失败', 500)
      }
    }
  )

  /**
   * 回滚到指定版本（仅管理员）
   */
  fastify.post<{ Params: ActivityIdParams; Body: RollbackBody }>(
    '/activity-configs/:activityId/rollback',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request, reply) => {
      try {
        const { activityId } = request.params
        const { version } = request.body

        if (!version || version < 1) {
          return error(reply, ErrorCode.INVALID_CONFIG_FORMAT, 'version 必须是大于 0 的整数')
        }

        // 查找当前生效的配置
        const currentConfig = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            deletedAt: null
          }
        })

        if (!currentConfig) {
          return error(reply, ErrorCode.ACTIVITY_CONFIG_NOT_FOUND, '活动配置不存在')
        }

        // 查找目标版本
        const targetConfig = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            version
          }
        })

        if (!targetConfig) {
          return error(reply, ErrorCode.VERSION_NOT_FOUND, '指定的版本不存在')
        }

        // 使用事务：软删除当前版本 + 恢复目标版本
        const rolledBackConfig = await prisma.$transaction(async (tx) => {
          // 1. 软删除当前版本
          await tx.activityConfig.update({
            where: { id: currentConfig.id },
            data: { deletedAt: new Date() }
          })

          // 2. 恢复目标版本（取消软删除）
          return tx.activityConfig.update({
            where: { id: targetConfig.id },
            data: { deletedAt: null }
          })
        })

        return ok(reply, rolledBackConfig, `已回滚到版本 ${version}`)
      } catch (err) {
        console.error('Rollback activity config error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '回滚失败', 500)
      }
    }
  )

  /**
   * 软删除当前活动配置（仅管理员）
   */
  fastify.delete<{ Params: ActivityIdParams }>(
    '/activity-configs/:activityId',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request, reply) => {
      try {
        const { activityId } = request.params

        // 查找当前生效的配置
        const currentConfig = await prisma.activityConfig.findFirst({
          where: {
            activityId,
            deletedAt: null
          }
        })

        if (!currentConfig) {
          return error(reply, ErrorCode.ACTIVITY_CONFIG_NOT_FOUND, '活动配置不存在')
        }

        // 软删除
        await prisma.activityConfig.update({
          where: { id: currentConfig.id },
          data: { deletedAt: new Date() }
        })

        return ok(reply, null, '删除成功')
      } catch (err) {
        console.error('Delete activity config error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '删除活动配置失败', 500)
      }
    }
  )
}
