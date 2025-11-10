import { QueryConfig, QueryResult, SearchResult } from '../types';

/**
 * Query pipeline dependencies
 * These are injected to avoid coupling to specific providers
 */
export interface QueryDependencies {
  embedText: (text: string) => Promise<number[]>;
  searchVectors: (vector: number[], topK: number) => Promise<SearchResult[]>;
}

/**
 * Query pipeline
 * Processes queries: embed -> search -> format
 */
export class QueryPipeline {
  private config: QueryConfig;
  private deps: QueryDependencies;

  constructor(config: QueryConfig, deps: QueryDependencies) {
    this.config = config;
    this.deps = deps;
  }

  /**
   * Process a query through the pipeline
   */
  async query(queryText: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Step 1: Generate embedding for query
      const queryVector = await this.deps.embedText(queryText);

      // Step 2: Search for similar vectors
      const searchResults = await this.deps.searchVectors(queryVector, this.config.topK);

      // Step 3: Filter by minimum score if configured
      const filteredResults = this.config.minScore
        ? searchResults.filter(result => result.score >= this.config.minScore!)
        : searchResults;

      const processingTimeMs = Date.now() - startTime;

      return {
        query: queryText,
        results: filteredResults,
        totalResults: filteredResults.length,
        processingTimeMs,
      };
    } catch (error: any) {
      throw new Error(`Query pipeline failed: ${error.message}`);
    }
  }

  /**
   * Process multiple queries in batch
   */
  async queryBatch(queries: string[]): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    for (const query of queries) {
      const result = await this.query(query);
      results.push(result);
    }

    return results;
  }
}
