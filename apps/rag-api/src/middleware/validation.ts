import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

export const IngestRequestSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  metadata: z.record(z.any()).optional(),
});

export const IngestFileRequestSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  metadata: z.record(z.any()).optional(),
});

export const QueryRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  topK: z.number().int().positive().optional(),
  minScore: z.number().min(0).max(1).optional(),
});

export type IngestRequest = z.infer<typeof IngestRequestSchema>;
export type IngestFileRequest = z.infer<typeof IngestFileRequestSchema>;
export type QueryRequest = z.infer<typeof QueryRequestSchema>;

/**
 * Validation middleware factory
 */
export function validate<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        reply.code(400).send({
          error: 'Invalid request',
        });
      }
    }
  };
}
