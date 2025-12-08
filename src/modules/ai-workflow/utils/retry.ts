import { AI_WORKFLOW_GLOBAL_CONFIG } from '../../../config/ai-workflows.config';
import { NetworkError } from './errors';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export function isRetryableError(error: any): boolean {
  const networkErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'];
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delayMs = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delayMs, config.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = AI_WORKFLOW_GLOBAL_CONFIG.retry,
  logger?: (message: string) => void,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < config.maxAttempts + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxAttempts) {
        throw error;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      const delayMs = getBackoffDelay(attempt, config);

      if (logger) {
        logger(`Retry attempt ${attempt + 1}/${config.maxAttempts} after ${delayMs}ms`);
      }

      await delay(delayMs);
    }
  }

  throw lastError;
}