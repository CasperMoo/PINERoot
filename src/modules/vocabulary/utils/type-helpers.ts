/**
 * 类型转换辅助函数
 *
 * 用于处理 Prisma Json 类型与自定义 TypeScript 类型之间的转换
 */

/**
 * 将自定义类型转换为 Prisma Json 可接受的类型
 * 用于存储到数据库
 */
export function toPrismaJson<T>(data: T): any {
  return data as any;
}

/**
 * 将 Prisma Json 类型转换为自定义类型
 * 用于从数据库读取
 */
export function fromPrismaJson<T>(jsonValue: unknown): T {
  return jsonValue as unknown as T;
}

/**
 * 安全地将 Prisma Json 转换为数组类型
 * 如果转换失败返回空数组
 */
export function fromPrismaJsonArray<T>(jsonValue: unknown): T[] {
  if (!jsonValue) return [];
  if (Array.isArray(jsonValue)) return jsonValue as T[];
  return [];
}
