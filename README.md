# RAG Pipeline Service

A production-ready, provider-agnostic Retrieval-Augmented Generation (RAG) pipeline service built with TypeScript. This service handles document ingestion, chunking, embedding, and semantic search without vendor lock-in.

## 🏗️ Architecture

This is a monorepo managed with Turborepo, consisting of:

### 📦 Packages

- **@rag-pipeline/core** - Core functionality including document chunking and pipeline orchestration
- **@rag-pipeline/providers** - Provider abstractions and implementations for vector stores, embeddings, and document loaders
- **@repo/typescript-config** - Shared TypeScript configurations

### 🚀 Apps

- **rag-api** - REST API service for ingestion and querying (port 8888)
- **web** - Web interface (Next.js React app on port 3333)

### 📁 Project Structure

```
rag-pipeline-service/
├── apps/
│   ├── rag-api/          # FastAPI backend service
│   └── web/              # Next.js web interface
├── packages/
│   ├── rag-core/         # Core RAG functionality  
│   ├── rag-providers/    # Provider implementations
│   └── typescript-config/ # Shared TypeScript configs
├── scripts/              # Development and deployment scripts
├── examples/             # Example files and test documents
├── docs/                 # Documentation
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 20+ & pnpm 9.0.0+ (for local development)

### Docker Deployment (Recommended)

1. **Clone and configure:**
   ```bash
   git clone <repo-url>
   cd rag-pipeline-service
   cp .env.example .env
   # Add your API keys to .env
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Access applications:**
   - **Web Interface**: http://localhost:3333
   - **RAG API**: http://localhost:8888
   - **Status Check**: http://localhost:3333/api/status

4. **Test the pipeline:**
   ```bash
   # Upload a document
   curl -X POST http://localhost:3333/api/upload \
     -F "file=@examples/test-upload.txt" \
     -F "category=test"
   
   # Query the document
   curl -X POST http://localhost:3333/api/query \
     -H "Content-Type: application/json" \
     -d '{"query": "Docker containers", "topK": 3}'
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build packages:**
   ```bash
   pnpm build
   ```

3. **Start services:**
   ```bash
   # Terminal 1: Start RAG API
   pnpm --filter=@rag-pipeline/api dev
   
   # Terminal 2: Start Web App
   pnpm --filter=@rag-pipeline/web dev
   ```

## 📡 API Overview

### Core Services

- **Web App (port 3333)**: Full-featured React interface for document upload and querying
- **RAG API (port 8888)**: Backend REST API for programmatic access

### Key Endpoints

- **GET** `/api/status` - System health and provider status
- **POST** `/api/upload` - Upload documents via web interface  
- **POST** `/api/query` - Query documents with enhanced metadata
- **POST** `/ingest` - Direct API ingestion of raw text
- **POST** `/query` - Direct API querying

> 📖 **Full API documentation**: [docs/API.md](docs/API.md)

## ⚙️ Configuration

### Environment Variables

```bash
# Embedding Provider
EMBEDDING_PROVIDER=gemini          # or 'openai'
GEMINI_API_KEY=your_key           # Required for Gemini
OPENAI_API_KEY=your_key           # Required for OpenAI

# Vector Store
VECTOR_STORE_PROVIDER=filesystem  # 'filesystem', 'postgres', or 'in-memory'
VECTOR_STORE_PATH=./data/vectors  # For filesystem only

# PostgreSQL Vector Store (optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=raguser
POSTGRES_PASSWORD=ragpassword
POSTGRES_DB=ragdb
POSTGRES_TABLE=vectors

# Document Processing
CHUNKING_STRATEGY=recursive       # Text splitting strategy
CHUNK_SIZE=512                    # Characters per chunk
CHUNK_OVERLAP=50                  # Overlap between chunks
```

> 🔧 **Full configuration guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 🔌 Provider Support

### Embeddings
- ✅ **Gemini** (text-embedding-004, 768 dimensions)
- ✅ **OpenAI** (text-embedding-3-small, 1536 dimensions)

### Vector Stores
- ✅ **PostgreSQL** with pgvector (Scalable production storage with native similarity search)
- ✅ **Filesystem** (JSON-based local storage)
- ✅ **In-Memory** (Development/testing)
- 🚧 Pinecone, Weaviate, Qdrant (planned)

### Document Types
- ✅ **Text** (.txt, .md files)
- ✅ **PDF** documents  
- ✅ **JSON** data
- Maximum file size: 10MB

## 🛠️ Development & Testing

### Quick Commands

```bash
# Install dependencies
pnpm install

# Build all packages  
pnpm build

# Run tests
pnpm test

# Lint and type check
pnpm lint
pnpm check-types
```

### Testing Scripts

```bash
# Test Docker deployment
./scripts/test-docker-deployment.sh

# Bulk ingest test documents
./scripts/bulk-ingest.sh examples/test-documents/

# Run query test suite
./scripts/query-test-suite.sh
```

> 🧪 **Testing utilities**: [scripts/README.md](scripts/README.md)  
> 📋 **Example documents**: [examples/README.md](examples/README.md)

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Docker deployment and configuration
- **[Scripts Documentation](scripts/README.md)** - Development and testing scripts  
- **[Examples](examples/README.md)** - Sample documents and usage examples

## 📄 License

MIT
