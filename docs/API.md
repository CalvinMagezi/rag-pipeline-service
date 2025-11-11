# API Documentation

## Base URLs

- **RAG API**: http://localhost:8888
- **Web API**: http://localhost:3333/api

## Authentication

Currently no authentication required for local development.

## Endpoints

### Health Check

#### GET `/health`
Basic health check for the RAG API service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T12:00:00Z"
}
```

#### GET `/health/detailed` 
Detailed health check with provider information.

#### GET `/api/status` (Web API)
Enhanced status with web app and API information.

**Response:**
```json
{
  "status": "healthy",
  "providers": {
    "vectorStore": {
      "type": "filesystem",
      "vectorCount": 42
    },
    "embedding": {
      "model": "gemini",
      "dimension": 768
    }
  },
  "web_app": {
    "status": "online",
    "version": "1.0.0",
    "api_url": "http://rag-api:8888",
    "features": [
      "file_upload",
      "real_time_query",
      "document_management",
      "analytics_dashboard"
    ]
  }
}
```

### Document Ingestion

#### POST `/ingest`
Ingest raw text content into the RAG system.

**Request:**
```json
{
  "content": "Your document text content here...",
  "metadata": {
    "source": "document.txt",
    "category": "technology",
    "author": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid-here",
  "chunksCreated": 3,
  "vectorsStored": 3
}
```

#### POST `/ingest/file`
Ingest a file by file path (server-side files only).

#### POST `/api/upload` (Web API)
Upload files through the web interface.

**Request:**
```bash
curl -X POST http://localhost:3333/api/upload \
  -F "file=@document.pdf" \
  -F "category=business"
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid-here",
  "chunksCreated": 5,
  "vectorsStored": 5,
  "metadata": {
    "source": "document.pdf",
    "category": "business",
    "file_type": "application/pdf",
    "file_size": 102400,
    "uploaded_at": "2025-11-11T12:00:00Z",
    "uploaded_via": "web_interface"
  },
  "processing": {
    "file_name": "document.pdf",
    "file_size": 102400,
    "content_length": 25000,
    "category": "business"
  }
}
```

**Supported File Types:**
- Text files: `.txt`, `.md`
- Documents: `.pdf`  
- Data: `.json`
- Maximum size: 10MB

### Querying

#### POST `/query`
Query the RAG system for relevant documents.

**Request:**
```json
{
  "query": "What is machine learning?",
  "topK": 5,
  "minScore": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "query": "What is machine learning?",
  "results": [
    {
      "id": "chunk-uuid",
      "score": 0.892,
      "content": "Machine learning is a subset of artificial intelligence...",
      "metadata": {
        "source": "ml-guide.md",
        "category": "technology",
        "documentId": "doc-uuid",
        "chunkIndex": 0
      }
    }
  ],
  "totalResults": 3,
  "processingTimeMs": 150
}
```

#### POST `/api/query` (Web API)
Same as above but with enhanced response metadata for web interface.

**Additional Response Fields:**
```json
{
  "performance": {
    "request_time_ms": 165,
    "processing_time_ms": 150,
    "total_time_ms": 165,
    "timestamp": "2025-11-11T12:00:00Z"
  },
  "query_info": {
    "original_query": "What is machine learning?",
    "processed_query": "What is machine learning?",
    "parameters": {
      "topK": 5,
      "minScore": 0.7
    }
  }
}
```

### Parameters

#### Query Parameters
- **`query`** (string, required): The search query
- **`topK`** (number, optional): Maximum results to return (1-20, default: 5)
- **`minScore`** (number, optional): Minimum similarity score (0-1, default: 0.1)

#### Upload Parameters
- **`file`** (file, required): The file to upload
- **`category`** (string, optional): Document category (default: "general")

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Query is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to process document",
  "details": "OpenAI embedding failed: 401 Unauthorized"
}
```

## Rate Limits

Currently no rate limiting implemented for local development.

## Examples

### Complete Upload and Query Flow

1. **Upload Document:**
```bash
curl -X POST http://localhost:3333/api/upload \
  -F "file=@examples/test-documents/tech/kubernetes-guide.md" \
  -F "category=technology"
```

2. **Query Document:**
```bash
curl -X POST http://localhost:3333/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to deploy applications with Kubernetes?",
    "topK": 3,
    "minScore": 0.7
  }'
```

3. **Check System Status:**
```bash
curl http://localhost:3333/api/status
```