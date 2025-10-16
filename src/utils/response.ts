import { FastifyReply } from "fastify";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export function ok<T>(reply: FastifyReply, data: T, message = "OK") {
  const body: ApiResponse<T> = { code: 0, message, data };
  return reply.status(200).send(body);
}

export function error<T = unknown>(
  reply: FastifyReply,
  code: number,
  message: string,
  httpStatus = 200,
  data?: T
) {
  const body: ApiResponse<T> = { code, message };
  if (data !== undefined) body.data = data;
  return reply.status(httpStatus).send(body);
}
