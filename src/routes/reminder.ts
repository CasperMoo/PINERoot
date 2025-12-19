import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { requireUser } from '../middleware/roleAuth'
import { ok, error, ErrorCode } from '../utils/response'
import {
  createReminder,
  getReminderList,
  getReminderById,
  updateReminder,
  deleteReminder,
  completeReminder,
  type CreateReminderParams,
  type UpdateReminderParams,
  type GetReminderListParams
} from '../services/reminder'
import type { Frequency, ReminderStatus, WeekDay } from '@prisma/client'

/**
 * 提醒模块路由
 */
export default async function reminderRoutes(fastify: FastifyInstance) {
  // 创建提醒
  fastify.post<{
    Body: Omit<CreateReminderParams, 'userId'>
  }>(
    '/reminders',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Body: Omit<CreateReminderParams, 'userId'>
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.currentUser!.id
        const params: CreateReminderParams = {
          ...request.body,
          userId
        }

        const reminder = await createReminder(params)
        return ok(reply, reminder, request.t('reminder.createSuccess'))
      } catch (err: any) {
        console.error('Create reminder error:', err)
        // 解析错误信息
        const message = err.message || request.t('reminder.createFailed')
        if (message.includes('title')) {
          return error(reply, ErrorCode.TITLE_REQUIRED, message)
        }
        if (message.includes('frequency')) {
          return error(reply, ErrorCode.FREQUENCY_REQUIRED, message)
        }
        if (message.includes('nextTriggerDate')) {
          return error(reply, ErrorCode.NEXT_TRIGGER_DATE_REQUIRED, message)
        }
        if (message.includes('interval')) {
          if (message.includes('greater than 0')) {
            return error(reply, ErrorCode.INVALID_INTERVAL, message)
          }
          return error(reply, ErrorCode.INTERVAL_REQUIRED, message)
        }
        if (message.includes('weekDays')) {
          return error(reply, ErrorCode.WEEKDAYS_REQUIRED, message)
        }
        if (message.includes('dayOfMonth')) {
          if (message.includes('between 1 and 31')) {
            return error(reply, ErrorCode.INVALID_DAY_OF_MONTH, message)
          }
          return error(reply, ErrorCode.DAY_OF_MONTH_REQUIRED, message)
        }
        if (message.includes('startDate')) {
          return error(reply, ErrorCode.START_DATE_REQUIRED, message)
        }
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, message, 500)
      }
    }
  )

  // 获取提醒列表
  fastify.get<{
    Querystring: {
      page?: string
      limit?: string
      frequency?: Frequency
      status?: ReminderStatus
      includeCompleted?: string
    }
  }>(
    '/reminders',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Querystring: {
          page?: string
          limit?: string
          frequency?: Frequency
          status?: ReminderStatus
          includeCompleted?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.currentUser!.id
        const query = request.query

        const params: GetReminderListParams = {
          userId,
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          frequency: query.frequency,
          status: query.status,
          includeCompleted: query.includeCompleted === 'true'
        }

        const result = await getReminderList(params)
        return ok(reply, result)
      } catch (err) {
        console.error('Get reminder list error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, request.t('reminder.listFailed'), 500)
      }
    }
  )

  // 获取提醒详情
  fastify.get<{
    Params: { id: string }
  }>(
    '/reminders/:id',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const reminderId = parseInt(request.params.id)
        const userId = request.currentUser!.id

        if (isNaN(reminderId)) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.invalidReminderId'))
        }

        const reminder = await getReminderById(reminderId, userId)
        if (!reminder) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.reminderNotFound'))
        }

        return ok(reply, reminder)
      } catch (err) {
        console.error('Get reminder error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, request.t('reminder.detailFailed'), 500)
      }
    }
  )

  // 更新提醒
  fastify.put<{
    Params: { id: string }
    Body: UpdateReminderParams
  }>(
    '/reminders/:id',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: UpdateReminderParams
      }>,
      reply: FastifyReply
    ) => {
      try {
        const reminderId = parseInt(request.params.id)
        const userId = request.currentUser!.id

        if (isNaN(reminderId)) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.invalidReminderId'))
        }

        const updated = await updateReminder(reminderId, userId, request.body)
        if (!updated) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.reminderNotFound'))
        }

        return ok(reply, updated, request.t('reminder.updateSuccess'))
      } catch (err) {
        console.error('Update reminder error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, request.t('reminder.updateFailed'), 500)
      }
    }
  )

  // 删除提醒（软删除）
  fastify.delete<{
    Params: { id: string }
  }>(
    '/reminders/:id',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const reminderId = parseInt(request.params.id)
        const userId = request.currentUser!.id

        if (isNaN(reminderId)) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.invalidReminderId'))
        }

        const deleted = await deleteReminder(reminderId, userId)
        if (!deleted) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.reminderNotFound'))
        }

        return reply.status(204).send()
      } catch (err) {
        console.error('Delete reminder error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, request.t('reminder.deleteFailed'), 500)
      }
    }
  )

  // 标记完成
  fastify.post<{
    Params: { id: string }
  }>(
    '/reminders/:id/complete',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const reminderId = parseInt(request.params.id)
        const userId = request.currentUser!.id

        if (isNaN(reminderId)) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.invalidReminderId'))
        }

        const completed = await completeReminder(reminderId, userId)
        if (!completed) {
          return error(reply, ErrorCode.REMINDER_NOT_FOUND, request.t('reminder.reminderNotFound'))
        }

        // 根据频率返回不同的提示信息
        const message = completed.frequency === 'ONCE'
          ? request.t('reminder.completeSuccess')
          : request.t('reminder.completeSuccessWithNextTrigger')

        return ok(reply, completed, message)
      } catch (err) {
        console.error('Complete reminder error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, request.t('reminder.completeFailed'), 500)
      }
    }
  )
}
