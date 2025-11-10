/**
 * Interface for embedding providers
 * Implement this interface to add support for new embedding models
 */
export interface IEmbeddingProvider {
  /**
   * Generate embeddings for an array of texts
   * @param texts - Array of text strings to embed
   * @returns Array of embedding vectors
   */
  embed(texts: string[]): Promise<number[][]>;

  /**
   * Generate embedding for a single text
   * @param text - Text string to embed
   * @returns Embedding vector
   */
  embedSingle(text: string): Promise<number[]>;

  /**
   * Get the dimension of the embeddings produced by this provider
   */
  getDimension(): number;

  /**
   * Get the name/model of the embedding provider
   */
  getModelName(): string;
}

/**
 * Configuration for embedding providers
 */
export interface EmbeddingConfig {
  provider: 'mock' | 'openai' | 'cohere' | 'huggingface';
  model?: string;
  apiKey?: string;
  dimension?: number;
  [key: string]: any;
}
