import { prisma } from '../db'

/**
 * 获取所有标签
 */
export async function getAllTags() {
  return prisma.imageTag.findMany({
    orderBy: { id: 'asc' }
  })
}

/**
 * 根据 ID 获取标签
 */
export async function getTagById(id: number) {
  return prisma.imageTag.findUnique({
    where: { id }
  })
}

/**
 * 根据名称获取标签
 */
export async function getTagByName(name: string) {
  return prisma.imageTag.findUnique({
    where: { name }
  })
}

/**
 * 创建新标签
 */
export async function createTag(name: string) {
  return prisma.imageTag.create({
    data: { name }
  })
}

/**
 * 更新标签名称
 */
export async function updateTag(id: number, name: string) {
  return prisma.imageTag.update({
    where: { id },
    data: { name }
  })
}

/**
 * 删除标签
 */
export async function deleteTag(id: number) {
  return prisma.imageTag.delete({
    where: { id }
  })
}

/**
 * 检查标签是否存在
 */
export async function tagExists(id: number): Promise<boolean> {
  const count = await prisma.imageTag.count({
    where: { id }
  })
  return count > 0
}

/**
 * 启动时自动初始化默认标签（如果不存在）
 */
export async function ensureDefaultTags() {
  const defaultTags = ['default', 'avatar', 'product', 'banner', 'other']

  for (const tagName of defaultTags) {
    await prisma.imageTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    })
  }
}
