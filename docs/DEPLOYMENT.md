# Deployment Guide

## Docker Deployment (Recommended)

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repo-url>
   cd rag-pipeline-service
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment:**
   ```bash
   # Check status
   curl http://localhost:3333/api/status
   
   # Test upload
   curl -X POST http://localhost:3333/api/upload \
     -F "file=@examples/test-upload.txt" \
     -F "category=test"
   
   # Test query  
   curl -X POST http://localhost:3333/api/query \
     -H "Content-Type: application/json" \
     -d '{"query": "Docker containers", "topK": 3}'
   ```

### Services

- **Web App**: http://localhost:3333 (React/Next.js interface)
- **RAG API**: http://localhost:8888 (FastAPI backend)
- **Status**: http://localhost:3333/api/status (Health check)

### Configuration

The deployment uses non-standard ports to avoid conflicts:
- Web App: `3333` (instead of default 3000)
- RAG API: `8888` (instead of default 3000)

### Environment Variables

Required in `.env`:
```bash
# Embedding Provider (choose one)
EMBEDDING_PROVIDER=gemini  # or 'openai'

# Gemini Configuration
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768

# OpenAI Configuration (alternative)
# OPENAI_API_KEY=your_openai_key
# EMBEDDING_MODEL=text-embedding-3-small
# EMBEDDING_DIMENSION=1536

# Vector Store
VECTOR_STORE_PROVIDER=filesystem
VECTOR_STORE_PATH=./data/vectors

# Chunking
CHUNKING_STRATEGY=recursive
CHUNK_SIZE=512
CHUNK_OVERLAP=50

# Query Configuration
QUERY_TOP_K=5
```

### Switching Providers

To switch between OpenAI and Gemini:

1. **Update docker-compose.yml** - uncomment desired provider
2. **Update .env** - set correct API keys
3. **Restart services:**
   ```bash
   # Clear vector store (if switching providers)
   docker-compose down
   docker volume rm rag-pipeline-service_rag-data
   docker-compose up -d
   ```

### Troubleshooting

**Port Conflicts:**
```bash
# Check if ports are in use
lsof -i :3333
lsof -i :8888

# Stop conflicting services or change ports in docker-compose.yml
```

**API Key Issues:**
```bash
# Verify keys are loaded
docker exec rag-api env | grep -E "(GEMINI|OPENAI)_API_KEY"

# Restart with fresh keys
docker-compose restart rag-api
```

**Vector Dimension Mismatch:**
```bash
# Clear vector store and restart
docker-compose down
docker volume rm rag-pipeline-service_rag-data
docker-compose up -d
```

### Production Deployment

For production environments:
- Use proper secrets management (not .env files)
- Configure external vector stores (Pinecone, Weaviate, etc.)
- Set up reverse proxy/load balancer
- Enable monitoring and logging
- Use production-grade databases