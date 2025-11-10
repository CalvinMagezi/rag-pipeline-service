import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentChunk, ChunkingConfig } from '../../types';

/**
 * Simple character-based text splitter
 * Splits text into chunks of a specified size with overlap
 */
export class CharacterSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: Pick<ChunkingConfig, 'chunkSize' | 'chunkOverlap'>) {
    this.chunkSize = config.chunkSize;
    this.chunkOverlap = config.chunkOverlap;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }
  }

  /**
   * Split a document into chunks based on character count
   */
  split(document: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const text = document.content;
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.chunkSize, text.length);
      const chunkContent = text.slice(startIndex, endIndex);

      chunks.push({
        id: uuidv4(),
        documentId: document.id,
        content: chunkContent,
        metadata: {
          ...document.metadata,
          startIndex,
          endIndex,
        },
        chunkIndex,
      });

      startIndex += this.chunkSize - this.chunkOverlap;
      chunkIndex++;
    }

    return chunks;
  }
}
