import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'
import bcrypt from 'bcrypt'
import { ok, error } from "../utils/response";

interface RegisterBody {
  email: string;
  password: string;
  nickname?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /register
  fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
    try {
      const { email, password, nickname } = request.body;

      // Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return error(reply, 1001, request.t('auth.invalidEmail'), 400);
      }

      if (password.length < 6) {
        return error(
          reply,
          1002,
          request.t('auth.passwordTooShort'),
          400
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return error(reply, 1003, request.t('auth.emailInUse'), 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: nickname || null,
        },
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id });

      // Return user without password
      const { password: _, ...userWithoutSensitiveData } = user;

      return ok(reply, {
        user: userWithoutSensitiveData,
        token,
      });
    } catch (err) {
      request.log.error(err);
      return error(reply, 1000, request.t('common.internalError'));
    }
  });

  // POST /login
  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return error(reply, 1004, request.t('auth.emailPasswordRequired'), 400);
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return error(reply, 2001, request.t('auth.invalidCredentials'), 400);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return error(reply, 2001, request.t('auth.invalidCredentials'), 400);
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id });

      // Return user without password
      const { password: _, ...userWithoutSensitiveData } = user;

      return ok(reply, {
        user: userWithoutSensitiveData,
        token,
      });
    } catch (err) {
      request.log.error(err);
      return error(reply, 1000, request.t('common.internalError'));
    }
  });
};

export default authRoutes
