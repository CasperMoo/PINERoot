import 'dotenv/config'

interface Config {
  PORT: number
  NODE_ENV: string
  DATABASE_URL: string
  JWT_SECRET: string
  OSS: {
    REGION: string
    ACCESS_KEY_ID: string
    ACCESS_KEY_SECRET: string
    BUCKET: string
    ENDPOINT: string
  }
  COZE_API_TOKEN: string
  COZE_API_BASE_URL: string
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OSS_REGION',
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_BUCKET',
  'OSS_ENDPOINT'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  OSS: {
    REGION: process.env.OSS_REGION!,
    ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID!,
    ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET!,
    BUCKET: process.env.OSS_BUCKET!,
    ENDPOINT: process.env.OSS_ENDPOINT!,
  },
  COZE_API_TOKEN: process.env.COZE_API_TOKEN || '',
  COZE_API_BASE_URL: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
}
