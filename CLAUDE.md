# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a TypeScript monorepo for a RAG (Retrieval-Augmented Generation) pipeline service, managed with Turborepo and pnpm workspaces. The architecture is designed to be provider-agnostic and production-ready.

### Core Structure

- **@rag-pipeline/core** (`packages/rag-core/`) - Core pipeline functionality including document chunking, ingestion pipeline, and query pipeline
- **@rag-pipeline/providers** (`packages/rag-providers/`) - Provider abstractions and implementations for vector stores, embeddings, and document loaders
- **@rag-pipeline/api** (`apps/rag-api/`) - Fastify-based REST API server

### Key Patterns

The codebase follows a provider pattern with factory initialization:
- Vector stores (in-memory, filesystem, future: Pinecone, Weaviate, Qdrant)
- Embedding providers (mock, OpenAI, future: Cohere, HuggingFace) 
- Document loaders (text, PDF, future: JSON)

The API server in `apps/rag-api/src/server.ts:28-31` initializes providers using `ProviderFactory` and creates `IngestionPipeline` and `QueryPipeline` instances.

## Common Development Commands

### Prerequisites
- Node.js 18+
- pnpm 9.0.0+

### Build and Development
```bash
# Install dependencies
pnpm install

# Build all packages (required before running API)
pnpm build

# Run API in development mode
pnpm --filter=@rag-pipeline/api dev

# Run all package builds in watch mode
pnpm dev

# Type checking across all packages
pnpm check-types

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### API-specific commands
```bash
# Build just the API
pnpm --filter=@rag-pipeline/api build

# Start production API server
pnpm --filter=@rag-pipeline/api start

# Development with hot reload
pnpm --filter=@rag-pipeline/api dev
```

### Package-specific development
```bash
# Work on core package
pnpm --filter=@rag-pipeline/core dev

# Work on providers package  
pnpm --filter=@rag-pipeline/providers dev
```

### Docker

#### Production Deployment with Docker Compose
```bash
# Set API keys in environment
export OPENAI_API_KEY=your-openai-key
export GEMINI_API_KEY=your-gemini-key

# Run with Docker Compose (recommended for production)
docker-compose up -d

# Check deployment status
docker-compose ps
docker-compose logs rag-api

# Stop deployment
docker-compose down
```

#### Manual Docker Build and Run
```bash
# Build the image
docker build -f apps/rag-api/Dockerfile -t rag-api .

# Run with OpenAI embeddings
docker run -d \
  -p 3000:3000 \
  -e EMBEDDING_PROVIDER=openai \
  -e OPENAI_API_KEY=your-key \
  -e EMBEDDING_DIMENSION=1536 \
  rag-api

# Run with Gemini embeddings  
docker run -d \
  -p 3000:3000 \
  -e EMBEDDING_PROVIDER=gemini \
  -e GEMINI_API_KEY=your-key \
  -e EMBEDDING_DIMENSION=768 \
  rag-api
```

#### Testing Docker Deployment
```bash
# Run comprehensive tests
./test-docker-deployment.sh

# Test Gemini provider specifically
./test-gemini-docker.sh
```

## Configuration

Configuration is handled via environment variables (see `.env.example`):

- **VECTOR_STORE_PROVIDER**: `in-memory` | `filesystem` | `pinecone` | `weaviate` | `qdrant`
- **EMBEDDING_PROVIDER**: `mock` | `openai` | `cohere` | `huggingface`
- **CHUNKING_STRATEGY**: `character` | `token` | `recursive`

The API server loads config from `apps/rag-api/src/config/index.ts` which reads environment variables.

## API Endpoints

- **Health**: `GET /health`, `GET /health/detailed`
- **Ingestion**: `POST /ingest`, `POST /ingest/file`
- **Query**: `POST /query`

## Testing and Quality

Always run type checking and linting before committing:
```bash
pnpm check-types
pnpm lint
```

The API server runs on port 3000 by default and can be configured via the `PORT` environment variable.