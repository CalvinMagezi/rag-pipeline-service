import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { IngestionPipeline } from '@rag-pipeline/core';
import { ProviderFactory } from '@rag-pipeline/providers';
import { validate, IngestRequestSchema, IngestFileRequestSchema } from '../middleware/validation';
import type { IngestRequest, IngestFileRequest } from '../middleware/validation';

/**
 * Ingestion routes
 */
export async function ingestRoutes(
  fastify: FastifyInstance,
  ingestionPipeline: IngestionPipeline
): Promise<void> {
  /**
   * Ingest raw text content
   */
  fastify.post<{ Body: IngestRequest }>(
    '/ingest',
    {
      preHandler: validate(IngestRequestSchema),
    },
    async (request, reply) => {
      const { content, metadata } = request.body;

      try {
        const document = {
          id: uuidv4(),
          content,
          metadata: metadata || {},
        };

        const result = await ingestionPipeline.ingest(document);

        if (result.success) {
          reply.code(201).send({
            success: true,
            documentId: result.documentId,
            chunksCreated: result.chunksCreated,
            vectorsStored: result.vectorsStored,
          });
        } else {
          reply.code(500).send({
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * Ingest a file
   */
  fastify.post<{ Body: IngestFileRequest }>(
    '/ingest/file',
    {
      preHandler: validate(IngestFileRequestSchema),
    },
    async (request, reply) => {
      const { filePath, metadata } = request.body;

      try {
        // Get appropriate loader for file
        const loader = ProviderFactory.getLoaderForFile(filePath);

        // Load document
        const document = await loader.load(filePath, metadata);

        // Ingest document
        const result = await ingestionPipeline.ingest(document);

        if (result.success) {
          reply.code(201).send({
            success: true,
            documentId: result.documentId,
            chunksCreated: result.chunksCreated,
            vectorsStored: result.vectorsStored,
          });
        } else {
          reply.code(500).send({
            success: false,
            error: result.error,
          });
        }
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
