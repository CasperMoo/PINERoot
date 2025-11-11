import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化默认标签...')

  const defaultTags = [
    { name: 'default' },
    { name: 'avatar' },
    { name: 'product' },
    { name: 'banner' },
    { name: 'other' }
  ]

  for (const tag of defaultTags) {
    const result = await prisma.imageTag.upsert({
      where: { name: tag.name },
      update: {},
      create: { name: tag.name }
    })
    console.log(`✓ 标签 "${result.name}" (id: ${result.id})`)
  }

  console.log('\n默认标签初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
