import { Pool, PoolClient, PoolConfig } from 'pg';
import { Vector, SearchResult } from '@rag-pipeline/core';
import { IVectorStore } from '../../interfaces';

/**
 * PostgreSQL configuration for vector store
 */
export interface PostgresVectorStoreConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  table?: string;
  maxConnections?: number;
}

/**
 * PostgreSQL with pgvector extension vector store implementation
 * Provides persistent, scalable vector storage with native similarity search
 * Requires PostgreSQL with pgvector extension installed
 */
export class PostgresVectorStore implements IVectorStore {
  private pool: Pool;
  private tableName: string;
  private dimension?: number;

  constructor(config: PostgresVectorStoreConfig) {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.maxConnections || 10,
    };

    this.pool = new Pool(poolConfig);
    this.tableName = config.table || 'vectors';
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create vectors table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          embedding vector,
          content TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for faster similarity search (using cosine distance)
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx
        ON ${this.tableName}
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      // Get dimension if vectors exist
      const result = await client.query(`
        SELECT embedding FROM ${this.tableName} LIMIT 1
      `);

      if (result.rows.length > 0) {
        const embedding = result.rows[0].embedding;
        if (typeof embedding === 'string') {
          // Parse vector string format: [1,2,3]
          const values = embedding.slice(1, -1).split(',').map(Number);
          this.dimension = values.length;
        } else if (Array.isArray(embedding)) {
          this.dimension = embedding.length;
        }
      }
    } finally {
      client.release();
    }
  }

  async upsert(vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const vector of vectors) {
        // Validate dimension consistency
        if (this.dimension === undefined) {
          this.dimension = vector.values.length;
        } else if (vector.values.length !== this.dimension) {
          throw new Error(
            `Vector dimension mismatch: expected ${this.dimension}, got ${vector.values.length}`
          );
        }

        // Upsert vector
        await client.query(
          `
          INSERT INTO ${this.tableName} (id, embedding, content, metadata)
          VALUES ($1, $2::vector, $3, $4)
          ON CONFLICT (id)
          DO UPDATE SET
            embedding = EXCLUDED.embedding,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            created_at = CURRENT_TIMESTAMP
          `,
          [
            vector.id,
            `[${vector.values.join(',')}]`,
            vector.metadata.content || '',
            JSON.stringify(vector.metadata),
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async query(queryVector: number[], topK: number): Promise<SearchResult[]> {
    const client = await this.pool.connect();
    try {
      // Use cosine distance for similarity search
      // pgvector returns distance, we convert to similarity (1 - distance)
      const result = await client.query(
        `
        SELECT
          id,
          content,
          metadata,
          1 - (embedding <=> $1::vector) as score
        FROM ${this.tableName}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        [`[${queryVector.join(',')}]`, topK]
      );

      return result.rows.map(row => ({
        id: row.id,
        score: parseFloat(row.score),
        content: row.content,
        metadata: row.metadata,
      }));
    } finally {
      client.release();
    }
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query(
        `DELETE FROM ${this.tableName} WHERE id = ANY($1)`,
        [ids]
      );
    } finally {
      client.release();
    }
  }

  async clear(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`TRUNCATE TABLE ${this.tableName}`);
      this.dimension = undefined;
    } finally {
      client.release();
    }
  }

  async count(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      return parseInt(result.rows[0].count, 10);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
