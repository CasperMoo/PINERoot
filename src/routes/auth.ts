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
        return error(reply, 1001, "Invalid email format");
      }

      if (password.length < 6) {
        return error(
          reply,
          1002,
          "Password must be at least 6 characters long"
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return error(reply, 1003, "Email already in use");
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
      return error(reply, 1000, "Internal server error");
    }
  });

  // POST /login
  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return error(reply, 1004, "Email and password are required");
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return error(reply, 2001, "Invalid credentials");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return error(reply, 2001, "Invalid credentials");
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
      return error(reply, 1000, "Internal server error");
    }
  });
};

export default authRoutes
