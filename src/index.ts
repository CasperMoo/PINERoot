import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { config } from './config'
import { prisma } from './db'
import authRoutes from './routes/auth'
import { authMiddleware } from './middleware/auth'
import './types'

const app = fastify({ logger: true })

async function start() {
  try {
    // Register CORS plugin
    await app.register(cors, {
      origin: true,
    })

    // Register JWT plugin
    await app.register(jwt, {
      secret: config.JWT_SECRET,
    })

    // Health check endpoint
    app.get('/health', async (request, reply) => {
      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`

        return reply.send({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: 'connected',
        })
      } catch (error) {
        return reply.status(503).send({
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        })
      }
    })

    // Register auth routes
    await app.register(authRoutes, { prefix: '/api/auth' })

    // Protected route - Get current user
    app.get('/api/me', {
      preHandler: [authMiddleware],
    }, async (request, reply) => {
      return reply.send({ user: request.user })
    })

    // Start server
    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    })

    console.log(`Server listening on http://0.0.0.0:${config.PORT}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, closing server gracefully...`)

  try {
    await app.close()
    await prisma.$disconnect()
    console.log('Server closed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()
