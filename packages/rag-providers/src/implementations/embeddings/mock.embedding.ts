import { IEmbeddingProvider } from '../../interfaces';

/**
 * Mock embedding provider for testing and development
 * Generates deterministic embeddings based on text hash
 */
export class MockEmbeddingProvider implements IEmbeddingProvider {
  private dimension: number;

  constructor(config: { dimension?: number } = {}) {
    this.dimension = config.dimension || 384; // Default to common embedding size
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.generateMockEmbedding(text));
  }

  async embedSingle(text: string): Promise<number[]> {
    return this.generateMockEmbedding(text);
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return 'mock-embedding-model';
  }

  /**
   * Generate a deterministic mock embedding from text
   * Uses a simple hash-based approach for consistency
   */
  private generateMockEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const hash = this.simpleHash(text);

    // Generate deterministic values based on text hash
    for (let i = 0; i < this.dimension; i++) {
      const seed = hash + i;
      // Simple pseudo-random number generator
      const value = Math.sin(seed) * 10000;
      embedding.push(value - Math.floor(value)); // Normalize to [0, 1)
    }

    // Normalize to unit vector (for cosine similarity)
    return this.normalize(embedding);
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
  }
}
