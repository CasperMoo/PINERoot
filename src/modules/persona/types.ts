export interface PersonaTemplateDTO {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonaTemplateInput {
  name: string;
  description?: string;
  prompt: string;
}

export interface UpdatePersonaTemplateInput {
  name?: string;
  description?: string;
  prompt?: string;
  isActive?: boolean;
}
