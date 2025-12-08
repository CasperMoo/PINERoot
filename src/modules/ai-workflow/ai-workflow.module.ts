import { ProviderFactory } from './ai-workflow.factory';
import { AIWorkflowService } from './ai-workflow.service';
import { AIWorkflowLogger } from './ai-workflow.logger';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export interface AIWorkflowModule {
  service: AIWorkflowService;
}

export async function createAIWorkflowModule(fastify: FastifyInstance, prisma: PrismaClient): Promise<AIWorkflowModule> {
  const providerFactory = new ProviderFactory();
  const logger = new AIWorkflowLogger(fastify.log, prisma);
  const service = new AIWorkflowService(providerFactory, logger);

  return { service };
}

// Legacy function for backward compatibility
export async function initAIWorkflowModule(fastify: FastifyInstance, prisma: PrismaClient): Promise<AIWorkflowModule> {
  return createAIWorkflowModule(fastify, prisma);
}

export type { AIWorkflowService };