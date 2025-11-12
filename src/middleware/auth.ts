import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../db'
import { error } from "../utils/response";

interface JWTPayload {
  userId: number;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(reply, 3001, "Unauthorized: No token provided");
    }

    // Verify token
    const payload = await request.jwtVerify<JWTPayload>();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return error(reply, 3002, "Unauthorized: User not found");
    }

    // Attach user to request
    request.currentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (err) {
    return error(reply, 3003, "Unauthorized: Invalid token");
  }
}
