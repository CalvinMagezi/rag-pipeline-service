import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '@rag-pipeline/core';
import { IDocumentLoader } from '../../interfaces';

/**
 * Text file loader
 * Supports .txt, .md, and other plain text files
 */
export class TextLoader implements IDocumentLoader {
  private supportedExtensions = ['.txt', '.md', '.markdown', '.text'];

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);

    return {
      id: uuidv4(),
      content,
      metadata: {
        ...metadata,
        source: filePath,
        fileName,
        fileType: extension,
        loadedAt: new Date().toISOString(),
      },
    };
  }

  async loadFromContent(content: string, metadata: Record<string, any> = {}): Promise<Document> {
    return {
      id: uuidv4(),
      content,
      metadata: {
        ...metadata,
        loadedAt: new Date().toISOString(),
      },
    };
  }

  supports(fileExtension: string): boolean {
    return this.supportedExtensions.includes(fileExtension.toLowerCase());
  }
}
