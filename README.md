# RAG Pipeline Service

A production-ready, provider-agnostic Retrieval-Augmented Generation (RAG) pipeline service built with TypeScript. This service handles document ingestion, chunking, embedding, and semantic search without vendor lock-in.

## 🏗️ Architecture

This is a monorepo managed with Turborepo, consisting of:

### Packages

- **@rag-pipeline/core** - Core functionality including document chunking and pipeline orchestration
- **@rag-pipeline/providers** - Provider abstractions and implementations for vector stores, embeddings, and document loaders
- **@repo/typescript-config** - Shared TypeScript configurations

### Apps

- **rag-api** - REST API service for ingestion and querying
- **docs** - Documentation (Next.js)
- **web** - Web interface (Next.js)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build packages:**
   ```bash
   pnpm build
   ```

4. **Run development server:**
   ```bash
   pnpm --filter=@rag-pipeline/api dev
   ```

   The API will be available at `http://localhost:3000`

### Docker Deployment

1. **Using Docker Compose (recommended for local dev):**
   ```bash
   docker-compose up -d
   ```

2. **Build and run manually:**
   ```bash
   docker build -f apps/rag-api/Dockerfile -t rag-api .
   docker run -p 3000:3000 rag-api
   ```

## 📡 API Endpoints

### Health Check

- **GET** `/health` - Basic health check
- **GET** `/health/detailed` - Detailed health with provider status

### Ingestion

- **POST** `/ingest` - Ingest raw text content
  ```json
  {
    "content": "Your document text here...",
    "metadata": {
      "source": "optional-source"
    }
  }
  ```

- **POST** `/ingest/file` - Ingest a file
  ```json
  {
    "filePath": "/path/to/document.txt",
    "metadata": {}
  }
  ```

### Query

- **POST** `/query` - Query the RAG system
  ```json
  {
    "query": "What is the main topic?",
    "topK": 5,
    "minScore": 0.7
  }
  ```

## ⚙️ Configuration

Configure via environment variables (see `.env.example`):

- **Vector Store:** `in-memory`, `filesystem`, `pinecone`, `weaviate`, `qdrant`
- **Embeddings:** `mock`, `openai`, `cohere`, `huggingface`
- **Chunking:** `character`, `token`, `recursive`

## 🔌 Provider Support

### Vector Stores
- ✅ In-Memory, ✅ Filesystem
- 🚧 Pinecone, Weaviate, Qdrant (planned)

### Embeddings
- ✅ Mock, ✅ OpenAI
- 🚧 Cohere, HuggingFace (planned)

### Loaders
- ✅ Text (.txt, .md), ✅ PDF
- 🚧 JSON (planned)

## 📦 Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm check-types
```

## 📝 License

MIT
