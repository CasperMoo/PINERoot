import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../db'

interface JWTPayload {
  userId: number
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' })
    }

    // Verify token
    const payload = await request.jwtVerify<JWTPayload>()

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized: User not found' })
    }

    // Attach user to request
    request.user = user
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' })
  }
}
