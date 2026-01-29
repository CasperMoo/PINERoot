import request from './request';

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
  return request.get('/persona-templates', {
    params: { includeInactive: includeInactive.toString() },
  });
}

export async function getPersonaTemplate(id: number): Promise<PersonaTemplate> {
  return request.get(`/persona-templates/${id}`);
}

export async function createPersonaTemplate(data: {
  name: string;
  description?: string;
  prompt: string;
}): Promise<PersonaTemplate> {
  return request.post('/persona-templates', data);
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
  return request.put(`/persona-templates/${id}`, data);
}

export async function deletePersonaTemplate(id: number): Promise<{ success: boolean }> {
  return request.delete(`/persona-templates/${id}`);
}
