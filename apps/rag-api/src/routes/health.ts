import { FastifyInstance } from 'fastify';
import { IVectorStore, IEmbeddingProvider } from '@rag-pipeline/providers';

/**
 * Health check routes
 */
export async function healthRoutes(
  fastify: FastifyInstance,
  vectorStore: IVectorStore,
  embeddingProvider: IEmbeddingProvider
): Promise<void> {
  /**
   * Basic health check
   */
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  /**
   * Detailed health check with provider status
   */
  fastify.get('/health/detailed', async (request, reply) => {
    try {
      const vectorCount = await vectorStore.count();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        providers: {
          vectorStore: {
            type: vectorStore.constructor.name,
            vectorCount,
          },
          embedding: {
            model: embeddingProvider.getModelName(),
            dimension: embeddingProvider.getDimension(),
          },
        },
      };
    } catch (error: any) {
      reply.code(503).send({
        status: 'unhealthy',
        error: error.message,
      });
    }
  });
}
