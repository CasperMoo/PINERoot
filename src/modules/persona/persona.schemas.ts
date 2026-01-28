import { z } from 'zod';

export const createPersonaTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10000),
});

export const updatePersonaTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePersonaTemplateSchema = z.infer<typeof createPersonaTemplateSchema>;
export type UpdatePersonaTemplateSchema = z.infer<typeof updatePersonaTemplateSchema>;
