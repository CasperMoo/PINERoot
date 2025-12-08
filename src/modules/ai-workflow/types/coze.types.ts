export interface CozeStreamRunRequest {
  workflow_id: string;
  app_id: string;
  parameters: Record<string, any>;
  ext?: Record<string, string>;
}