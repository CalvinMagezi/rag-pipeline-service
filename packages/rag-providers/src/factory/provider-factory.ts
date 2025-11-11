import {
  IVectorStore,
  IEmbeddingProvider,
  IDocumentLoader,
  VectorStoreConfig,
  EmbeddingConfig,
  DocumentLoaderConfig,
} from '../interfaces';

import {
  InMemoryVectorStore,
  FilesystemVectorStore,
  PostgresVectorStore,
  MockEmbeddingProvider,
  OpenAIEmbeddingProvider,
  GeminiEmbeddingProvider,
  TextLoader,
  PDFLoader,
} from '../implementations';

/**
 * Factory for creating provider instances based on configuration
 * Enables runtime provider selection without code changes
 */
export class ProviderFactory {
  /**
   * Create a vector store instance based on configuration
   */
  static createVectorStore(config: VectorStoreConfig): IVectorStore {
    switch (config.provider) {
      case 'in-memory':
        return new InMemoryVectorStore();

      case 'filesystem':
        if (!config.storagePath) {
          throw new Error('storagePath is required for filesystem vector store');
        }
        return new FilesystemVectorStore({ storagePath: config.storagePath });

      case 'postgres':
        if (!config.host || !config.database || !config.user || !config.password) {
          throw new Error('host, database, user, and password are required for postgres vector store');
        }
        return new PostgresVectorStore({
          host: config.host,
          port: config.port || 5432,
          database: config.database,
          user: config.user,
          password: config.password,
          table: config.table,
          maxConnections: config.maxConnections,
        });

      case 'pinecone':
        throw new Error('Pinecone vector store not yet implemented');

      case 'weaviate':
        throw new Error('Weaviate vector store not yet implemented');

      case 'qdrant':
        throw new Error('Qdrant vector store not yet implemented');

      default:
        throw new Error(`Unknown vector store provider: ${config.provider}`);
    }
  }

  /**
   * Create an embedding provider instance based on configuration
   */
  static createEmbeddingProvider(config: EmbeddingConfig): IEmbeddingProvider {
    switch (config.provider) {
      case 'mock':
        return new MockEmbeddingProvider({ dimension: config.dimension });

      case 'openai':
        if (!config.apiKey) {
          throw new Error('apiKey is required for OpenAI embedding provider');
        }
        return new OpenAIEmbeddingProvider({
          apiKey: config.apiKey,
          model: config.model,
          dimension: config.dimension,
        });

      case 'gemini':
        if (!config.apiKey) {
          throw new Error('apiKey is required for Gemini embedding provider');
        }
        return new GeminiEmbeddingProvider({
          apiKey: config.apiKey,
          model: config.model,
          dimension: config.dimension,
        });

      case 'cohere':
        throw new Error('Cohere embedding provider not yet implemented');

      case 'huggingface':
        throw new Error('HuggingFace embedding provider not yet implemented');

      default:
        throw new Error(`Unknown embedding provider: ${config.provider}`);
    }
  }

  /**
   * Create a document loader instance based on configuration
   */
  static createDocumentLoader(config: DocumentLoaderConfig): IDocumentLoader {
    switch (config.type) {
      case 'text':
      case 'markdown':
        return new TextLoader();

      case 'pdf':
        return new PDFLoader();

      case 'json':
        throw new Error('JSON document loader not yet implemented');

      default:
        throw new Error(`Unknown document loader type: ${config.type}`);
    }
  }

  /**
   * Get appropriate document loader based on file extension
   */
  static getLoaderForFile(filePath: string): IDocumentLoader {
    const extension = filePath.toLowerCase().split('.').pop() || '';

    if (['txt', 'md', 'markdown', 'text'].includes(extension)) {
      return new TextLoader();
    }

    if (extension === 'pdf') {
      return new PDFLoader();
    }

    throw new Error(`No loader available for file extension: .${extension}`);
  }
}
