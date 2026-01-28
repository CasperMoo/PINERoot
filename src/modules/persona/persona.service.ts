import { PrismaClient, PersonaTemplate } from '@prisma/client';
import { CreatePersonaTemplateInput, UpdatePersonaTemplateInput, PersonaTemplateDTO } from './types';
import { NotFoundError } from '../../utils/errors';

export class PersonaService {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(template: PersonaTemplate): PersonaTemplateDTO {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  async getAll(includeInactive = false): Promise<PersonaTemplateDTO[]> {
    const templates = await this.prisma.personaTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map(t => this.toDTO(t));
  }

  async getById(id: number): Promise<PersonaTemplateDTO> {
    const template = await this.prisma.personaTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundError('persona.notFound', `Persona template ${id} not found`);
    }
    return this.toDTO(template);
  }

  async create(input: CreatePersonaTemplateInput): Promise<PersonaTemplateDTO> {
    const template = await this.prisma.personaTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        prompt: input.prompt,
      },
    });
    return this.toDTO(template);
  }

  async update(id: number, input: UpdatePersonaTemplateInput): Promise<PersonaTemplateDTO> {
    // Check exists
    await this.getById(id);

    const template = await this.prisma.personaTemplate.update({
      where: { id },
      data: input,
    });
    return this.toDTO(template);
  }

  async delete(id: number): Promise<void> {
    // Check exists
    await this.getById(id);

    // Soft delete by setting isActive to false
    await this.prisma.personaTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
