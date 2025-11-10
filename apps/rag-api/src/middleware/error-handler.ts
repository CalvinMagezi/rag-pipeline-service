import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Global error handler
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error
  request.log.error(error);

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Send error response
  reply.code(statusCode).send({
    error: error.message || 'Internal server error',
    statusCode,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  });
}
