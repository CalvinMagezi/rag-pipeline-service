import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '@rag-pipeline/core';
import { IDocumentLoader } from '../../interfaces';

/**
 * PDF file loader
 * Requires the 'pdf-parse' package to be installed
 */
export class PDFLoader implements IDocumentLoader {
  private pdfParse: any;

  constructor() {
    this.initializePDFParse();
  }

  private initializePDFParse(): void {
    try {
      // Dynamic import to make pdf-parse optional
      this.pdfParse = require('pdf-parse');
    } catch (error) {
      throw new Error(
        'pdf-parse package not installed. Please run: npm install pdf-parse'
      );
    }
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await this.pdfParse(dataBuffer);
    const fileName = path.basename(filePath);

    return {
      id: uuidv4(),
      content: data.text,
      metadata: {
        ...metadata,
        source: filePath,
        fileName,
        fileType: '.pdf',
        pageCount: data.numpages,
        loadedAt: new Date().toISOString(),
      },
    };
  }

  async loadFromContent(content: string, metadata: Record<string, any> = {}): Promise<Document> {
    // For PDF, we can't really load from string content directly
    // This would require base64 encoded PDF or similar
    throw new Error('PDFLoader does not support loading from raw content string');
  }

  supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.pdf';
  }
}
