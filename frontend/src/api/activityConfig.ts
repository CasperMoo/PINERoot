import request from './request'

/**
 * 活动配置类型
 */
export interface ActivityConfig {
  id: number
  activityId: string
  config: Record<string, unknown>
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * 创建活动配置参数
 */
export interface CreateActivityConfigParams {
  activityId: string
  config: Record<string, unknown>
}

/**
 * 更新活动配置参数
 */
export interface UpdateActivityConfigParams {
  config: Record<string, unknown>
}

/**
 * 回滚参数
 */
export interface RollbackParams {
  version: number
}

/**
 * 活动配置 API
 */
export const activityConfigApi = {
  /**
   * 获取所有活动的最新配置列表
   */
  getList: async (): Promise<ActivityConfig[]> => {
    const res = await request.get<ActivityConfig[]>('/activity-configs')
    return res.data
  },

  /**
   * 获取指定活动的最新配置
   */
  getLatest: async (activityId: string): Promise<ActivityConfig> => {
    const res = await request.get<ActivityConfig>(`/activity-configs/${activityId}`)
    return res.data
  },

  /**
   * 获取指定活动的所有历史版本
   */
  getHistory: async (activityId: string): Promise<ActivityConfig[]> => {
    const res = await request.get<ActivityConfig[]>(`/activity-configs/${activityId}/history`)
    return res.data
  },

  /**
   * 创建新活动配置
   */
  create: async (params: CreateActivityConfigParams): Promise<ActivityConfig> => {
    const res = await request.post<ActivityConfig>('/activity-configs', params)
    return res.data
  },

  /**
   * 更新活动配置（软删除旧版本 + 新增记录）
   */
  update: async (
    activityId: string,
    params: UpdateActivityConfigParams
  ): Promise<ActivityConfig> => {
    const res = await request.patch<ActivityConfig>(`/activity-configs/${activityId}`, params)
    return res.data
  },

  /**
   * 回滚到指定版本
   */
  rollback: async (activityId: string, params: RollbackParams): Promise<ActivityConfig> => {
    const res = await request.post<ActivityConfig>(
      `/activity-configs/${activityId}/rollback`,
      params
    )
    return res.data
  },

  /**
   * 软删除当前活动配置
   */
  delete: async (activityId: string): Promise<void> => {
    await request.delete(`/activity-configs/${activityId}`)
  }
}
