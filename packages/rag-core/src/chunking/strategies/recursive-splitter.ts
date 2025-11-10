import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentChunk, ChunkingConfig } from '../../types';

/**
 * Recursive text splitter
 * Attempts to split text on multiple separators in order of preference
 * Falls back to character splitting if needed
 */
export class RecursiveSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(config: Pick<ChunkingConfig, 'chunkSize' | 'chunkOverlap' | 'separators'>) {
    this.chunkSize = config.chunkSize;
    this.chunkOverlap = config.chunkOverlap;
    // Default separators: paragraph, line break, sentence, word, character
    this.separators = config.separators || ['\n\n', '\n', '. ', ' ', ''];

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }
  }

  /**
   * Split text recursively using the separator hierarchy
   */
  private splitTextRecursive(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];
    const separator = separators[0];
    const newSeparators = separators.slice(1);

    // Split by current separator
    const splits = separator ? text.split(separator) : [text];

    // Process each split
    let currentChunk = '';
    for (const split of splits) {
      const testChunk = currentChunk ? currentChunk + separator + split : split;

      if (testChunk.length <= this.chunkSize) {
        currentChunk = testChunk;
      } else {
        // Current chunk is full
        if (currentChunk) {
          finalChunks.push(currentChunk);
        }

        // If split is still too large and we have more separators, recurse
        if (split.length > this.chunkSize && newSeparators.length > 0) {
          finalChunks.push(...this.splitTextRecursive(split, newSeparators));
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) {
      finalChunks.push(currentChunk);
    }

    return finalChunks;
  }

  /**
   * Add overlap between chunks
   */
  private addOverlap(chunks: string[]): string[] {
    if (this.chunkOverlap === 0 || chunks.length <= 1) {
      return chunks;
    }

    const overlappedChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const currentChunk = chunks[i];
      if (!currentChunk) continue;

      let chunk = currentChunk;

      // Add overlap from previous chunk
      if (i > 0 && this.chunkOverlap > 0) {
        const prevChunk = chunks[i - 1];
        if (prevChunk) {
          const overlapText = prevChunk.slice(-this.chunkOverlap);
          chunk = overlapText + chunk;
        }
      }

      overlappedChunks.push(chunk);
    }

    return overlappedChunks;
  }

  /**
   * Split a document into chunks using recursive splitting
   */
  split(document: Document): DocumentChunk[] {
    const textChunks = this.splitTextRecursive(document.content, this.separators);
    const overlappedChunks = this.addOverlap(textChunks);

    return overlappedChunks.map((content, index) => ({
      id: uuidv4(),
      documentId: document.id,
      content,
      metadata: {
        ...document.metadata,
      },
      chunkIndex: index,
    }));
  }
}
