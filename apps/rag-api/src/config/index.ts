import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { ChunkingConfig, IngestionConfig, QueryConfig } from '@rag-pipeline/core';
import {
  VectorStoreConfig,
  EmbeddingConfig,
} from '@rag-pipeline/providers';

// Load environment variables from the project root
dotenvConfig({ path: resolve(__dirname, '../../../../.env') });

/**
 * Application configuration
 * Centralized configuration from environment variables
 */
export interface AppConfig {
  server: {
    port: number;
    host: string;
    env: string;
  };
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  chunking: ChunkingConfig;
  ingestion: IngestionConfig;
  query: QueryConfig;
}

/**
 * Get chunking strategy from environment
 */
function getChunkingStrategy(): 'character' | 'token' | 'recursive' {
  const strategy = process.env.CHUNKING_STRATEGY?.toLowerCase();
  if (strategy === 'character' || strategy === 'token' || strategy === 'recursive') {
    return strategy;
  }
  return 'recursive'; // default
}

/**
 * Get the appropriate API key based on embedding provider
 */
function getEmbeddingApiKey(provider?: string): string | undefined {
  switch (provider?.toLowerCase()) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'gemini':
      return process.env.GEMINI_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Get the appropriate model based on embedding provider
 */
function getEmbeddingModel(provider?: string): string {
  switch (provider?.toLowerCase()) {
    case 'openai':
      return process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    case 'gemini':
      return process.env.GEMINI_MODEL || 'text-embedding-004';
    case 'ollama':
      return process.env.OLLAMA_MODEL || 'nomic-embed-text';
    default:
      return 'mock-model';
  }
}

/**
 * Get the API URL for providers that use custom endpoints
 */
function getApiUrl(provider?: string): string | undefined {
  switch (provider?.toLowerCase()) {
    case 'ollama':
      return process.env.OLLAMA_API_URL || 'http://localhost:11434';
    default:
      return undefined;
  }
}

/**
 * Load and validate configuration from environment
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    server: {
      port: parseInt(process.env.PORT || '8888', 10),
      host: process.env.HOST || '0.0.0.0',
      env: process.env.NODE_ENV || 'development',
    },
    vectorStore: {
      provider: (process.env.VECTOR_STORE_PROVIDER as any) || 'in-memory',
      storagePath: process.env.VECTOR_STORE_PATH || './data/vectors',
    },
    embedding: {
      provider: (process.env.EMBEDDING_PROVIDER as any) || 'mock',
      apiKey: getEmbeddingApiKey(process.env.EMBEDDING_PROVIDER),
      apiUrl: getApiUrl(process.env.EMBEDDING_PROVIDER),
      model: getEmbeddingModel(process.env.EMBEDDING_PROVIDER),
      dimension: parseInt(process.env.EMBEDDING_DIMENSION || '384', 10),
    },
    chunking: {
      strategy: getChunkingStrategy(),
      chunkSize: parseInt(process.env.CHUNK_SIZE || '512', 10),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '50', 10),
      separators: process.env.CHUNK_SEPARATORS?.split(','),
    },
    ingestion: {
      chunkingConfig: {} as ChunkingConfig, // Will be set below
    },
    query: {
      topK: parseInt(process.env.QUERY_TOP_K || '5', 10),
      minScore: process.env.QUERY_MIN_SCORE
        ? parseFloat(process.env.QUERY_MIN_SCORE)
        : undefined,
    },
  };

  // Set ingestion chunking config
  config.ingestion.chunkingConfig = config.chunking;

  // Validate required fields
  if (config.embedding.provider === 'openai' && !config.embedding.apiKey) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI embedding provider');
  }
  
  if (config.embedding.provider === 'gemini' && !config.embedding.apiKey) {
    throw new Error('GEMINI_API_KEY is required when using Gemini embedding provider');
  }

  return config;
}

// Export singleton config instance
export const appConfig = loadConfig();
