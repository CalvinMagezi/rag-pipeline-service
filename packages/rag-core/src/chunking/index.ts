import { Document, DocumentChunk, ChunkingConfig } from '../types';
import { CharacterSplitter } from './strategies/character-splitter';
import { TokenSplitter } from './strategies/token-splitter';
import { RecursiveSplitter } from './strategies/recursive-splitter';

/**
 * Interface for text splitting strategies
 */
export interface TextSplitter {
  split(document: Document): DocumentChunk[];
}

/**
 * Factory function to create the appropriate text splitter based on config
 */
export function createTextSplitter(config: ChunkingConfig): TextSplitter {
  switch (config.strategy) {
    case 'character':
      return new CharacterSplitter(config);
    case 'token':
      return new TokenSplitter(config);
    case 'recursive':
      return new RecursiveSplitter(config);
    default:
      throw new Error(`Unknown chunking strategy: ${config.strategy}`);
  }
}

// Export individual splitters for direct use if needed
export { CharacterSplitter, TokenSplitter, RecursiveSplitter };
