/**
 * Core types for the RAG pipeline
 */

/**
 * Represents a document to be processed
 */
export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Represents a chunk of a document
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
}

/**
 * Represents a vector embedding
 */
export interface Vector {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

/**
 * Represents a search result from vector similarity search
 */
export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

/**
 * Configuration for text chunking
 */
export interface ChunkingConfig {
  strategy: 'character' | 'token' | 'recursive';
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

/**
 * Configuration for the ingestion pipeline
 */
export interface IngestionConfig {
  chunkingConfig: ChunkingConfig;
}

/**
 * Configuration for the query pipeline
 */
export interface QueryConfig {
  topK: number;
  minScore?: number;
}

/**
 * Result of an ingestion operation
 */
export interface IngestionResult {
  documentId: string;
  chunksCreated: number;
  vectorsStored: number;
  success: boolean;
  error?: string;
}

/**
 * Result of a query operation
 */
export interface QueryResult {
  query: string;
  results: SearchResult[];
  totalResults: number;
  processingTimeMs: number;
}
