import { Document, DocumentChunk, Vector, IngestionConfig, IngestionResult } from '../types';
import { createTextSplitter } from '../chunking';

/**
 * Ingestion pipeline dependencies
 * These are injected to avoid coupling to specific providers
 */
export interface IngestionDependencies {
  embedTexts: (texts: string[]) => Promise<number[][]>;
  storeVectors: (vectors: Vector[]) => Promise<void>;
}

/**
 * Ingestion pipeline
 * Processes documents: chunk -> embed -> store
 */
export class IngestionPipeline {
  private config: IngestionConfig;
  private deps: IngestionDependencies;

  constructor(config: IngestionConfig, deps: IngestionDependencies) {
    this.config = config;
    this.deps = deps;
  }

  /**
   * Process a single document through the ingestion pipeline
   */
  async ingest(document: Document): Promise<IngestionResult> {
    try {
      // Step 1: Chunk the document
      const splitter = createTextSplitter(this.config.chunkingConfig);
      const chunks = splitter.split(document);

      if (chunks.length === 0) {
        return {
          documentId: document.id,
          chunksCreated: 0,
          vectorsStored: 0,
          success: false,
          error: 'No chunks created from document',
        };
      }

      // Step 2: Generate embeddings for all chunks
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.deps.embedTexts(texts);

      // Validate embeddings length
      if (embeddings.length !== chunks.length) {
        throw new Error(
          `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
        );
      }

      // Step 3: Create vectors with metadata
      const vectors: Vector[] = chunks.map((chunk, index) => {
        const embedding = embeddings[index];
        if (!embedding) {
          throw new Error(`Missing embedding for chunk ${index}`);
        }
        return {
          id: chunk.id,
          values: embedding,
          metadata: {
            ...chunk.metadata,
            content: chunk.content,
            documentId: chunk.documentId,
            chunkIndex: chunk.chunkIndex,
          },
        };
      });

      // Step 4: Store vectors
      await this.deps.storeVectors(vectors);

      return {
        documentId: document.id,
        chunksCreated: chunks.length,
        vectorsStored: vectors.length,
        success: true,
      };
    } catch (error: any) {
      return {
        documentId: document.id,
        chunksCreated: 0,
        vectorsStored: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process multiple documents through the ingestion pipeline
   */
  async ingestBatch(documents: Document[]): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    for (const document of documents) {
      const result = await this.ingest(document);
      results.push(result);
    }

    return results;
  }
}
