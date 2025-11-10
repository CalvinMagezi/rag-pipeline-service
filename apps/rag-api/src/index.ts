import { createServer } from './server';
import { appConfig } from './config';

/**
 * Start the RAG API server
 */
async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: appConfig.server.port,
      host: appConfig.server.host,
    });

    server.log.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              RAG Pipeline Service Started                ║
║                                                           ║
║  Server: http://${appConfig.server.host}:${appConfig.server.port}                              ║
║  Environment: ${appConfig.server.env}                            ║
║  Vector Store: ${appConfig.vectorStore.provider.padEnd(20)}                      ║
║  Embedding: ${appConfig.embedding.provider.padEnd(20)}                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    server.log.info('Available endpoints:');
    server.log.info('  GET  /health - Basic health check');
    server.log.info('  GET  /health/detailed - Detailed health check');
    server.log.info('  POST /ingest - Ingest raw text content');
    server.log.info('  POST /ingest/file - Ingest a file');
    server.log.info('  POST /query - Query the RAG system');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
