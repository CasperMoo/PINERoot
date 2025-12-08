import { CozeProvider } from './providers/coze.provider';
import { AbstractAIProvider } from './providers/base.provider';

export class ProviderFactory {
  private providers = new Map<string, AbstractAIProvider>();

  constructor() {
    this.registerProvider('coze', new CozeProvider());
  }

  private registerProvider(name: string, provider: AbstractAIProvider): void {
    this.providers.set(name, provider);
  }

  create(providerName: string): AbstractAIProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    return provider;
  }
}