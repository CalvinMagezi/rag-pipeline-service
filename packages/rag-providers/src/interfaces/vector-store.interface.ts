import { Vector, SearchResult } from '@rag-pipeline/core';

/**
 * Interface for vector store providers
 * Implement this interface to add support for new vector databases
 */
export interface IVectorStore {
  /**
   * Initialize the vector store (e.g., create collections, connect to DB)
   */
  initialize(): Promise<void>;

  /**
   * Insert or update vectors in the store
   * @param vectors - Array of vectors to upsert
   */
  upsert(vectors: Vector[]): Promise<void>;

  /**
   * Query the vector store for similar vectors
   * @param vector - Query vector
   * @param topK - Number of results to return
   * @returns Array of search results sorted by similarity score
   */
  query(vector: number[], topK: number): Promise<SearchResult[]>;

  /**
   * Delete vectors by their IDs
   * @param ids - Array of vector IDs to delete
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Clear all vectors from the store
   */
  clear(): Promise<void>;

  /**
   * Get the total count of vectors in the store
   */
  count(): Promise<number>;

  /**
   * Close/cleanup the vector store connection
   */
  close(): Promise<void>;
}

/**
 * Configuration for vector store providers
 */
export interface VectorStoreConfig {
  provider: 'in-memory' | 'filesystem' | 'pinecone' | 'weaviate' | 'qdrant';
  dimension?: number;
  [key: string]: any;
}
