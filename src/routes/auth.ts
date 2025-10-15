import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'
import bcrypt from 'bcrypt'

interface RegisterBody {
  email: string
  password: string
  name?: string
}

interface LoginBody {
  email: string
  password: string
}

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /register
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body

      // Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return reply.status(400).send({ error: 'Invalid email format' })
      }

      if (password.length < 6) {
        return reply.status(400).send({ error: 'Password must be at least 6 characters long' })
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return reply.status(400).send({ error: 'Email already in use' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        },
      })

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id })

      // Return user without password
      const { password: _, ...userWithoutPassword } = user

      return reply.status(201).send({
        user: userWithoutPassword,
        token,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /login
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const { email, password } = request.body

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' })
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id })

      // Return user without password
      const { password: _, ...userWithoutPassword } = user

      return reply.send({
        user: userWithoutPassword,
        token,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default authRoutes
