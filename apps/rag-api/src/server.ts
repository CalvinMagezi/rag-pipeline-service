import Fastify from 'fastify';
import cors from '@fastify/cors';
import { IngestionPipeline, QueryPipeline } from '@rag-pipeline/core';
import { IVectorStore, IEmbeddingProvider, ProviderFactory } from '@rag-pipeline/providers';
import { appConfig } from './config';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes, ingestRoutes, queryRoutes } from './routes';

/**
 * Create and configure the Fastify server
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: appConfig.server.env === 'production' ? 'info' : 'debug',
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins (configure as needed)
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Initialize providers
  const vectorStore: IVectorStore = ProviderFactory.createVectorStore(appConfig.vectorStore);
  const embeddingProvider: IEmbeddingProvider = ProviderFactory.createEmbeddingProvider(
    appConfig.embedding
  );

  // Initialize vector store
  await vectorStore.initialize();
  fastify.log.info(
    `Vector store initialized: ${appConfig.vectorStore.provider}`
  );
  fastify.log.info(
    `Embedding provider initialized: ${appConfig.embedding.provider} (${embeddingProvider.getModelName()})`
  );

  // Create pipelines
  const ingestionPipeline = new IngestionPipeline(appConfig.ingestion, {
    embedTexts: (texts) => embeddingProvider.embed(texts),
    storeVectors: (vectors) => vectorStore.upsert(vectors),
  });

  const queryPipeline = new QueryPipeline(appConfig.query, {
    embedText: (text) => embeddingProvider.embedSingle(text),
    searchVectors: (vector, topK) => vectorStore.query(vector, topK),
  });

  // Register routes
  await healthRoutes(fastify, vectorStore, embeddingProvider);
  await ingestRoutes(fastify, ingestionPipeline);
  await queryRoutes(fastify, queryPipeline);

  // Graceful shutdown
  const closeGracefully = async (signal: string) => {
    fastify.log.info(`Received ${signal}, closing gracefully...`);
    await vectorStore.close();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', () => closeGracefully('SIGINT'));
  process.on('SIGTERM', () => closeGracefully('SIGTERM'));

  return fastify;
}
