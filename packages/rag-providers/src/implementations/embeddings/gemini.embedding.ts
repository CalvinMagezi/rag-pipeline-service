import { IEmbeddingProvider } from '../../interfaces';

/**
 * Google Gemini embedding provider
 * Requires the '@google/generative-ai' package to be installed
 */
export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimension: number;
  private genAI: any; // Dynamic import to make it optional

  constructor(config: { apiKey: string; model?: string; dimension?: number }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-004';
    
    // Set dimension based on model
    if (config.dimension) {
      this.dimension = config.dimension;
    } else {
      // Default dimensions for Gemini models
      this.dimension = this.model === 'text-embedding-004' ? 768 : 768;
    }

    this.initializeGemini();
  }

  private initializeGemini(): void {
    try {
      // Dynamic import to make Google AI optional
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      throw new Error(
        'Google Generative AI package not installed. Please run: npm install @google/generative-ai'
      );
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      // Process texts in batches to avoid rate limits
      const embeddings: number[][] = [];
      const batchSize = 100; // Adjust based on API limits
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.embedSingleInternal(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
      }

      return embeddings;
    } catch (error: any) {
      throw new Error(`Gemini embedding failed: ${error.message}`);
    }
  }

  async embedSingle(text: string): Promise<number[]> {
    return this.embedSingleInternal(text);
  }

  private async embedSingleInternal(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.embedContent(text);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding returned from Gemini API');
      }
      
      return result.embedding.values;
    } catch (error: any) {
      throw new Error(`Gemini single embedding failed: ${error.message}`);
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }
}