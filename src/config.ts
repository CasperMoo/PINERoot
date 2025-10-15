import 'dotenv/config'

interface Config {
  PORT: number
  NODE_ENV: string
  DATABASE_URL: string
  JWT_SECRET: string
}

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']

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
}
