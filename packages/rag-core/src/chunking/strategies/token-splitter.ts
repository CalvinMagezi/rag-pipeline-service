import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentChunk, ChunkingConfig } from '../../types';

/**
 * Token-based text splitter
 * Splits text based on approximate token count (using whitespace as proxy)
 */
export class TokenSplitter {
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
   * Approximate token count (simple whitespace-based splitting)
   * For production, consider using a proper tokenizer like tiktoken
   */
  private approximateTokenCount(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  /**
   * Split a document into chunks based on token count
   */
  split(document: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const tokens = this.approximateTokenCount(document.content);
    let startTokenIndex = 0;
    let chunkIndex = 0;

    while (startTokenIndex < tokens.length) {
      const endTokenIndex = Math.min(startTokenIndex + this.chunkSize, tokens.length);
      const chunkTokens = tokens.slice(startTokenIndex, endTokenIndex);
      const chunkContent = chunkTokens.join(' ');

      chunks.push({
        id: uuidv4(),
        documentId: document.id,
        content: chunkContent,
        metadata: {
          ...document.metadata,
          tokenCount: chunkTokens.length,
        },
        chunkIndex,
      });

      startTokenIndex += this.chunkSize - this.chunkOverlap;
      chunkIndex++;
    }

    return chunks;
  }
}
