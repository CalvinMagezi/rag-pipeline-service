import { IEmbeddingProvider } from '../../interfaces';

/**
 * OpenAI embedding provider
 * Requires the 'openai' package to be installed
 */
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimension: number;
  private openai: any; // Dynamic import to make it optional

  constructor(config: { apiKey: string; model?: string; dimension?: number }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-3-small';

    // Set dimension based on model
    if (config.dimension) {
      this.dimension = config.dimension;
    } else {
      // Default dimensions for common models
      this.dimension = this.model === 'text-embedding-3-small' ? 1536 : 1536;
    }

    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    try {
      // Dynamic import to make OpenAI optional
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey: this.apiKey });
    } catch (error) {
      throw new Error(
        'OpenAI package not installed. Please run: npm install openai'
      );
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map((item: any) => item.embedding);
    } catch (error: any) {
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embed([text]);
    const embedding = embeddings[0];
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    return embedding;
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }
}
