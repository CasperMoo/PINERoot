import { FastifyRequest } from 'fastify'

export interface UserPayload {
  id: number
  email: string
  name: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload
  }
}
