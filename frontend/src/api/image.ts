import request from './request'
import type { ApiResponse } from './types'
import type { ImageTag } from './imageTag'

/**
 * 图片信息
 */
export interface Image {
  id: number
  userId: number
  originalName: string
  ossKey: string
  ossUrl: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  tagId: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  tag?: ImageTag
}

/**
 * 图片列表查询参数
 */
export interface ImageListQuery {
  page?: number
  pageSize?: number
  tagId?: number
  userId?: number
}

/**
 * 图片列表响应
 */
export interface ImageListResponse {
  items: Image[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 上传结果
 */
export interface UploadResult {
  success: Array<{
    originalName: string
    image: Image
  }>
  failed: Array<{
    originalName: string
    error: string
  }>
}

/**
 * 修改标签请求参数
 */
export interface UpdateImageTagRequest {
  tagId: number
}

/**
 * 图片 API
 */
export const imageApi = {
  /**
   * 上传图片
   */
  async upload(files: File[], tagId?: number): Promise<UploadResult> {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })

    if (tagId) {
      formData.append('tagId', tagId.toString())
    }

    const response: ApiResponse<UploadResult> = await request.post(
      '/images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data!
  },

  /**
   * 获取图片列表
   */
  async getList(query?: ImageListQuery): Promise<ImageListResponse> {
    const response: ApiResponse<ImageListResponse> = await request.get('/images', {
      params: query
    })
    return response.data!
  },

  /**
   * 获取图片详情
   */
  async getDetail(id: number): Promise<Image> {
    const response: ApiResponse<Image> = await request.get(`/images/${id}`)
    return response.data!
  },

  /**
   * 修改图片标签
   */
  async updateTag(id: number, data: UpdateImageTagRequest): Promise<Image> {
    const response: ApiResponse<Image> = await request.patch(`/images/${id}/tag`, data)
    return response.data!
  },

  /**
   * 删除图片
   */
  async delete(id: number): Promise<void> {
    await request.delete(`/images/${id}`)
  }
}
