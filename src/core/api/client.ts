/**
 * Base API Client
 */

import type { APIConfig, GenerationRequest, GenerationResponse } from '../../types';

export abstract class APIClient {
  protected config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  /**
   * Send a generation request to the LLM API
   */
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;

  /**
   * Send a streaming generation request
   * @param request Generation request
   * @param onToken Callback for each token received
   */
  abstract generateStream(
    request: GenerationRequest,
    onToken: (token: string) => void
  ): Promise<GenerationResponse>;

  /**
   * Test the API connection
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get available models
   */
  abstract getModels(): Promise<string[]>;
}
