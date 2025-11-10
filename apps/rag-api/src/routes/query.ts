import { FastifyInstance } from 'fastify';
import { QueryPipeline } from '@rag-pipeline/core';
import { validate, QueryRequestSchema } from '../middleware/validation';
import type { QueryRequest } from '../middleware/validation';

/**
 * Query routes
 */
export async function queryRoutes(
  fastify: FastifyInstance,
  queryPipeline: QueryPipeline
): Promise<void> {
  /**
   * Query the RAG system
   */
  fastify.post<{ Body: QueryRequest }>(
    '/query',
    {
      preHandler: validate(QueryRequestSchema),
    },
    async (request, reply) => {
      const { query, topK, minScore } = request.body;

      try {
        // Override config if provided in request
        if (topK !== undefined) {
          queryPipeline['config'].topK = topK;
        }
        if (minScore !== undefined) {
          queryPipeline['config'].minScore = minScore;
        }

        const result = await queryPipeline.query(query);

        reply.code(200).send({
          success: true,
          query: result.query,
          results: result.results,
          totalResults: result.totalResults,
          processingTimeMs: result.processingTimeMs,
        });
      } catch (error: any) {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: error.message,
        });
      }
    }
  );
}
