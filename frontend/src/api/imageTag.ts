import request from './request'
import type { ApiResponse } from './types'

/**
 * 图片标签
 */
export interface ImageTag {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * 创建标签请求参数
 */
export interface CreateTagRequest {
  name: string
}

/**
 * 修改标签请求参数
 */
export interface UpdateTagRequest {
  name: string
}

/**
 * 图片标签 API
 */
export const imageTagApi = {
  /**
   * 获取所有标签
   */
  async getTags(): Promise<ImageTag[]> {
    const response: ApiResponse<ImageTag[]> = await request.get('/image-tags')
    return response.data || []
  },

  /**
   * 创建新标签
   */
  async createTag(data: CreateTagRequest): Promise<ImageTag> {
    const response: ApiResponse<ImageTag> = await request.post('/image-tags', data)
    return response.data!
  },

  /**
   * 修改标签名称
   */
  async updateTag(id: number, data: UpdateTagRequest): Promise<ImageTag> {
    const response: ApiResponse<ImageTag> = await request.patch(`/image-tags/${id}`, data)
    return response.data!
  },

  /**
   * 删除标签
   */
  async deleteTag(id: number): Promise<void> {
    await request.delete(`/image-tags/${id}`)
  }
}
