import { PrismaClient, ChatSession, ChatMessage } from '@prisma/client';
import { LLMProviderService, LLMMessage, DEFAULT_MODEL_ID } from '../llm-provider';
import { MemoryService } from '../memory';
import { ChatSessionDTO, ChatMessageDTO, GetMessagesQuery, UpdateSessionInput } from './types';
import { NotFoundError, ValidationError } from '../../utils/errors';

const DEFAULT_SYSTEM_PROMPT = `你是一个温暖、善解人意的朋友，愿意倾听用户的心声，给予情感支持和陪伴。
请用温和、真诚的语气与用户交流，像一个知心朋友一样。`;

export class ChatService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly llm: LLMProviderService,
    private readonly memory: MemoryService
  ) {}

  private sessionToDTO(session: ChatSession & { persona?: { id: number; name: string } | null }): ChatSessionDTO {
    return {
      id: session.id,
      userId: session.userId,
      personaId: session.personaId,
      modelId: session.modelId,
      mem0Id: session.mem0Id,
      isActive: session.isActive,
      createdAt: session.createdAt,
      persona: session.persona ? { id: session.persona.id, name: session.persona.name } : null,
    };
  }

  private messageToDTO(message: ChatMessage): ChatMessageDTO {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      modelId: message.modelId,
      createdAt: message.createdAt,
    };
  }

  async getOrCreateSession(userId: number): Promise<ChatSessionDTO> {
    // Try to find active session
    let session = await this.prisma.chatSession.findFirst({
      where: { userId, isActive: true },
      include: { persona: { select: { id: true, name: true } } },
    });

    if (!session) {
      // Create new session
      const mem0Id = this.memory.generateMem0Id(userId);
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          mem0Id,
          modelId: DEFAULT_MODEL_ID,
        },
        include: { persona: { select: { id: true, name: true } } },
      });
    }

    return this.sessionToDTO(session);
  }

  async getSession(userId: number): Promise<ChatSessionDTO | null> {
    const session = await this.prisma.chatSession.findFirst({
      where: { userId, isActive: true },
      include: { persona: { select: { id: true, name: true } } },
    });
    return session ? this.sessionToDTO(session) : null;
  }

  async updateSession(userId: number, input: UpdateSessionInput): Promise<ChatSessionDTO> {
    const session = await this.getOrCreateSession(userId);

    // Validate modelId if provided
    if (input.modelId && !this.llm.isModelAvailable(input.modelId)) {
      throw new ValidationError('chat.invalidModel', `Model ${input.modelId} is not available`);
    }

    // Validate personaId if provided
    if (input.personaId) {
      const persona = await this.prisma.personaTemplate.findUnique({
        where: { id: input.personaId, isActive: true },
      });
      if (!persona) {
        throw new NotFoundError('chat.personaNotFound', `Persona ${input.personaId} not found`);
      }
    }

    const updated = await this.prisma.chatSession.update({
      where: { id: session.id },
      data: input,
      include: { persona: { select: { id: true, name: true } } },
    });

    return this.sessionToDTO(updated);
  }

  async getMessages(userId: number, query: GetMessagesQuery): Promise<{ messages: ChatMessageDTO[]; hasMore: boolean }> {
    const session = await this.getSession(userId);
    if (!session) {
      return { messages: [], hasMore: false };
    }

    const limit = query.limit || 50;
    const where: any = { sessionId: session.id };

    if (query.before) {
      where.id = { lt: query.before };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there's more
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    // Return in chronological order
    return {
      messages: messages.reverse().map(m => this.messageToDTO(m)),
      hasMore,
    };
  }

  async *sendMessage(userId: number, content: string): AsyncGenerator<string, void, unknown> {
    // 1. Get or create session
    const session = await this.getOrCreateSession(userId);
    const modelId = session.modelId || DEFAULT_MODEL_ID;

    // 2. Get persona prompt
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (session.personaId) {
      const persona = await this.prisma.personaTemplate.findUnique({
        where: { id: session.personaId },
      });
      if (persona) {
        systemPrompt = persona.prompt;
      }
    }

    // 3. Get relevant memories
    const memories = await this.memory.getRelevantMemories(session.mem0Id, content);

    // 4. Get recent messages
    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 5. Build messages array
    const fullSystemPrompt = this.buildSystemPrompt(systemPrompt, memories);
    const messages: LLMMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...recentMessages.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // 6. Save user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
      },
    });

    // 7. Call LLM and stream response
    let fullResponse = '';
    const stream = this.llm.chatStream({ model: modelId, messages });

    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    // 8. Save assistant response
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: fullResponse,
        modelId,
      },
    });

    // 9. Save memory (async, don't wait)
    this.memory.saveMemory(session.mem0Id, [
      { role: 'user', content },
      { role: 'assistant', content: fullResponse },
    ]).catch(err => console.error('Failed to save memory:', err));
  }

  async clearHistory(userId: number): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) {
      return; // Nothing to clear
    }

    // Deactivate current session
    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        clearedAt: new Date(),
      },
    });

    // Clear mem0 memories
    await this.memory.clearMemories(session.mem0Id);
  }

  private buildSystemPrompt(personaPrompt: string, memories: string): string {
    if (!memories) {
      return personaPrompt;
    }

    return `${personaPrompt}

## 关于用户的记忆
${memories}

请基于以上信息，以设定的角色与用户对话。`;
  }

  getAvailableModels() {
    return this.llm.getAvailableModels();
  }
}
