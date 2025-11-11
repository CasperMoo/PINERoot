import OSS from 'ali-oss'
import { config } from '../config'
import { randomUUID } from 'crypto'
import { getExtensionFromMimeType } from '../utils/validation'

// OSS 客户端实例（单例）
let ossClient: OSS | null = null

/**
 * 获取 OSS 客户端实例
 */
export function getOSSClient(): OSS {
  if (!ossClient) {
    ossClient = new OSS({
      region: config.OSS.REGION,
      accessKeyId: config.OSS.ACCESS_KEY_ID,
      accessKeySecret: config.OSS.ACCESS_KEY_SECRET,
      bucket: config.OSS.BUCKET,
    })
  }
  return ossClient
}

/**
 * 生成唯一的 OSS 文件 key
 * 格式：{userId}/{timestamp}-{uuid}.{ext}
 */
export function generateOSSKey(userId: number, mimetype: string): string {
  const timestamp = Date.now()
  const uuid = randomUUID()
  const ext = getExtensionFromMimeType(mimetype)
  return `${userId}/${timestamp}-${uuid}.${ext}`
}

/**
 * 上传文件到 OSS
 * @param buffer 文件 Buffer
 * @param ossKey OSS 存储路径
 * @returns OSS 访问 URL
 */
export async function uploadToOSS(
  buffer: Buffer,
  ossKey: string
): Promise<string> {
  try {
    const client = getOSSClient()
    const result = await client.put(ossKey, buffer)

    // 返回公开访问 URL（使用自定义域名或默认域名）
    return config.OSS.ENDPOINT
      ? `${config.OSS.ENDPOINT}/${ossKey}`
      : result.url
  } catch (error) {
    console.error('OSS upload failed:', error)
    throw new Error('OSS 上传失败')
  }
}

/**
 * 从 OSS 删除文件
 * @param ossKey OSS 存储路径
 */
export async function deleteFromOSS(ossKey: string): Promise<void> {
  try {
    const client = getOSSClient()
    await client.delete(ossKey)
  } catch (error) {
    console.error('OSS delete failed:', error)
    // 删除失败不抛出异常，只记录日志
  }
}

/**
 * 批量删除文件（可选，用于未来扩展）
 */
export async function batchDeleteFromOSS(ossKeys: string[]): Promise<void> {
  try {
    const client = getOSSClient()
    await client.deleteMulti(ossKeys)
  } catch (error) {
    console.error('OSS batch delete failed:', error)
  }
}
