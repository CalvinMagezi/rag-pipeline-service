import { Document } from '@rag-pipeline/core';

/**
 * Interface for document loaders
 * Implement this interface to add support for new document types
 */
export interface IDocumentLoader {
  /**
   * Load a document from a file path
   * @param filePath - Path to the document file
   * @param metadata - Optional metadata to attach to the document
   * @returns Loaded document
   */
  load(filePath: string, metadata?: Record<string, any>): Promise<Document>;

  /**
   * Load a document from raw content
   * @param content - Raw document content
   * @param metadata - Optional metadata to attach to the document
   * @returns Loaded document
   */
  loadFromContent(content: string, metadata?: Record<string, any>): Promise<Document>;

  /**
   * Check if this loader supports a given file type
   * @param fileExtension - File extension (e.g., '.txt', '.pdf')
   */
  supports(fileExtension: string): boolean;
}

/**
 * Configuration for document loaders
 */
export interface DocumentLoaderConfig {
  type: 'text' | 'pdf' | 'markdown' | 'json';
  [key: string]: any;
}
