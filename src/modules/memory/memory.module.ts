import { FastifyInstance } from 'fastify';
import { MemoryService } from './memory.service';
import { config } from '../../config';

export interface MemoryModule {
  service: MemoryService;
}

export async function initMemoryModule(
  app: FastifyInstance
): Promise<MemoryModule> {
  const service = new MemoryService(config.MEM0_API_KEY);

  app.log.info(
    `Memory module initialized: ${service.isEnabled ? 'enabled' : 'disabled (no API key)'}`
  );

  return { service };
}
