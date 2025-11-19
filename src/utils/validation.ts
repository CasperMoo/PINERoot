import { MultipartFile } from '@fastify/multipart'

// 允许的图片类型
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const

// 单个文件最大大小 (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

/**
 * 校验文件类型
 */
export function validateFileType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype as any)
}

/**
 * 校验文件大小
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * 校验图片文件
 * @returns 返回错误信息，如果为 null 则通过校验
 */
export function validateImageFile(file: MultipartFile): string | null {
  // 检查文件类型
  if (!validateFileType(file.mimetype)) {
    return `文件类型不支持: ${file.filename}。仅支持 ${ALLOWED_MIME_TYPES.join(', ')}`
  }

  // 检查文件大小（如果有的话）
  if (file.file.bytesRead && !validateFileSize(file.file.bytesRead)) {
    return `文件大小超限: ${file.filename}。单个文件最大 ${MAX_FILE_SIZE / 1024 / 1024}MB`
  }

  return null
}

/**
 * 从文件名获取扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * 从 MIME 类型获取扩展名
 */
export function getExtensionFromMimeType(mimetype: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  }
  return map[mimetype] || 'jpg'
}
