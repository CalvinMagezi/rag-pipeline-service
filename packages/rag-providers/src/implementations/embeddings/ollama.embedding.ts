import { IEmbeddingProvider } from '../../interfaces';

/**
 * Ollama Embedding Provider
 * Connects to local Ollama instance for embedding generation
 * Supports any Ollama embedding model (nomic-embed-text, mxbai-embed-large, etc.)
 */
export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private apiUrl: string;
  private model: string;
  private dimension: number;

  constructor(config: {
    apiUrl?: string;
    model?: string;
    dimension?: number;
  }) {
    this.apiUrl = config.apiUrl || 'http://localhost:11434';
    this.model = config.model || 'nomic-embed-text';

    // Set dimension based on model if not provided
    if (config.dimension) {
      this.dimension = config.dimension;
    } else {
      // Default dimensions for common Ollama embedding models
      this.dimension = this.getDefaultDimension(this.model);
    }
  }

  /**
   * Get default embedding dimension for common Ollama models
   */
  private getDefaultDimension(model: string): number {
    const dimensions: Record<string, number> = {
      'nomic-embed-text': 768,
      'mxbai-embed-large': 1024,
      'all-minilm': 384,
      'snowflake-arctic-embed': 1024,
    };

    return dimensions[model] || 768; // Default to 768 if unknown
  }

  /**
   * Make a request to the Ollama API
   */
  private async makeRequest(endpoint: string, body: any): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ollama API request failed with status ${response.status}: ${errorText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
        throw new Error(
          `Cannot connect to Ollama at ${this.apiUrl}. Please ensure Ollama is running.`
        );
      }
      throw new Error(`Ollama embedding request failed: ${error.message}`);
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    try {
      // Ollama's /api/embeddings endpoint processes one text at a time
      // We'll make concurrent requests for better performance
      const embeddingPromises = texts.map(text =>
        this.makeRequest('/api/embeddings', {
          model: this.model,
          prompt: text,
        })
      );

      const responses = await Promise.all(embeddingPromises);
      return responses.map((response: any) => response.embedding);
    } catch (error: any) {
      throw new Error(`Ollama batch embedding failed: ${error.message}`);
    }
  }

  async embedSingle(text: string): Promise<number[]> {
    try {
      const response = await this.makeRequest('/api/embeddings', {
        model: this.model,
        prompt: text,
      });

      const embedding = response.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from Ollama');
      }

      return embedding;
    } catch (error: any) {
      throw new Error(`Ollama single embedding failed: ${error.message}`);
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }
}
