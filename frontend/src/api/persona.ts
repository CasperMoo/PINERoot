import request from './request';
import type { ApiResponse } from './types';

export interface PersonaTemplate {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getPersonaTemplates(
  includeInactive = false
): Promise<{ templates: PersonaTemplate[] }> {
  const response: ApiResponse<{ templates: PersonaTemplate[] }> = await request.get('/persona-templates', {
    params: { includeInactive: includeInactive.toString() },
  });
  return response.data!;
}

export async function getPersonaTemplate(id: number): Promise<PersonaTemplate> {
  const response: ApiResponse<PersonaTemplate> = await request.get(`/persona-templates/${id}`);
  return response.data!;
}

export async function createPersonaTemplate(data: {
  name: string;
  description?: string;
  prompt: string;
}): Promise<PersonaTemplate> {
  const response: ApiResponse<PersonaTemplate> = await request.post('/persona-templates', data);
  return response.data!;
}

export async function updatePersonaTemplate(
  id: number,
  data: {
    name?: string;
    description?: string;
    prompt?: string;
    isActive?: boolean;
  }
): Promise<PersonaTemplate> {
  const response: ApiResponse<PersonaTemplate> = await request.put(`/persona-templates/${id}`, data);
  return response.data!;
}

export async function deletePersonaTemplate(id: number): Promise<{ success: boolean }> {
  const response: ApiResponse<{ success: boolean }> = await request.delete(`/persona-templates/${id}`);
  return response.data!;
}
