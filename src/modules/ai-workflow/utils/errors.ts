export class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms: ${message}`);
    this.name = 'TimeoutError';
  }
}

export class InterruptError extends Error {
  constructor(
    public workflowName: string,
    public eventId: string,
    public type: number,
  ) {
    super(`Workflow ${workflowName} interrupted by event ${eventId} (type: ${type})`);
    this.name = 'InterruptError';
  }
}

export class APIError extends Error {
  constructor(
    public code: number | string,
    message: string,
  ) {
    super(`API Error ${code}: ${message}`);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError: any,
  ) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
  }
}