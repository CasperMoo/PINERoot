import request from './request'

/**
 * 相册配置类型
 */
export interface Gallery {
  name: string
  imageTag: string
}

/**
 * 获取相册列表响应类型
 */
export interface GetGalleriesResponse {
  galleries: Gallery[]
}

/**
 * 图片类型（后端公开接口返回的数据，已过滤敏感信息）
 */
export interface HalloweenImage {
  id: number
  ossUrl: string
  originalName: string
}

/**
 * 获取图片列表响应类型（后端实际返回格式）
 */
export interface GetImagesResponse {
  gallery: Gallery
  items: HalloweenImage[]
  total: number
  page: number
  limit: number
  pageSize: number
  totalPages: number
}

/**
 * Halloween 活动 API
 */
export const halloweenApi = {
  /**
   * 获取 Halloween 相册列表（公开接口）
   */
  getGalleries: async (): Promise<GetGalleriesResponse> => {
    const res = await request.get<GetGalleriesResponse>('/anchor/halloween/galleries')
    return res.data
  },

  /**
   * 获取指定相册的图片列表（公开接口）
   * @param tagName 图片标签名称（来自 gallery.imageTag）
   */
  getImages: async (tagName: string): Promise<GetImagesResponse> => {
    const res = await request.get<GetImagesResponse>('/anchor/halloween/images', {
      params: { tagName }
    })
    return res.data
  }
}
