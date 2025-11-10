import { promises as fs } from 'fs';
import * as path from 'path';
import { Vector, SearchResult } from '@rag-pipeline/core';
import { IVectorStore } from '../../interfaces';

/**
 * Filesystem-based vector store implementation
 * Persists vectors to disk as JSON files
 * Suitable for small to medium deployments with persistence requirements
 */
export class FilesystemVectorStore implements IVectorStore {
  private vectors: Map<string, Vector> = new Map();
  private dimension?: number;
  private storagePath: string;
  private indexFile: string;

  constructor(config: { storagePath: string }) {
    this.storagePath = config.storagePath;
    this.indexFile = path.join(this.storagePath, 'vectors.json');
  }

  async initialize(): Promise<void> {
    // Create storage directory if it doesn't exist
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Load existing vectors if available
    try {
      const data = await fs.readFile(this.indexFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.dimension = parsed.dimension;

      for (const vector of parsed.vectors) {
        this.vectors.set(vector.id, vector);
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist yet, start fresh
    }
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

    // Persist to disk
    await this.persist();
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

    await this.persist();
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    this.dimension = undefined;
    await this.persist();
  }

  async count(): Promise<number> {
    return this.vectors.size;
  }

  async close(): Promise<void> {
    // Ensure final state is persisted
    await this.persist();
  }

  /**
   * Persist vectors to disk
   */
  private async persist(): Promise<void> {
    const data = {
      dimension: this.dimension,
      vectors: Array.from(this.vectors.values()),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(this.indexFile, JSON.stringify(data, null, 2), 'utf-8');
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
