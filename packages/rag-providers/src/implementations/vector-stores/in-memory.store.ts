import { Vector, SearchResult } from '@rag-pipeline/core';
import { IVectorStore } from '../../interfaces';

/**
 * In-memory vector store implementation
 * Suitable for development, testing, and small-scale deployments
 * Data is lost when the process terminates
 */
export class InMemoryVectorStore implements IVectorStore {
  private vectors: Map<string, Vector> = new Map();
  private dimension?: number;

  async initialize(): Promise<void> {
    this.vectors.clear();
  }

  async upsert(vectors: Vector[]): Promise<void> {
    for (const vector of vectors) {
      // Validate dimension consistency
      if (this.dimension === undefined) {
        this.dimension = vector.values.length;
      } else if (vector.values.length !== this.dimension) {
        throw new Error(
          `Vector dimension mismatch: expected ${this.dimension}, got ${vector.values.length}`
        );
      }

      this.vectors.set(vector.id, vector);
    }
  }

  async query(queryVector: number[], topK: number): Promise<SearchResult[]> {
    if (this.vectors.size === 0) {
      return [];
    }

    // Calculate cosine similarity for all vectors
    const results: Array<{ id: string; score: number; vector: Vector }> = [];

    for (const [id, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryVector, vector.values);
      results.push({ id, score: similarity, vector });
    }

    // Sort by similarity (descending) and take top K
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, topK);

    // Map to SearchResult format
    return topResults.map(({ id, score, vector }) => ({
      id,
      score,
      content: vector.metadata.content || '',
      metadata: vector.metadata,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.vectors.delete(id);
    }
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    this.dimension = undefined;
  }

  async count(): Promise<number> {
    return this.vectors.size;
  }

  async close(): Promise<void> {
    // No cleanup needed for in-memory store
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) {
        throw new Error('Vector contains undefined values');
      }
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
