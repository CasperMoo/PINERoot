import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  before: z.coerce.number().int().optional(),
});

export const updateSessionModelSchema = z.object({
  modelId: z.string().min(1),
});

export const updateSessionPersonaSchema = z.object({
  personaId: z.number().int().positive(),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type GetMessagesQuerySchema = z.infer<typeof getMessagesQuerySchema>;
