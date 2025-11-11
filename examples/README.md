# Examples

This directory contains example files, test documents, and sample implementations for the RAG Pipeline service.

## Contents

### Test Documents (`test-documents/`)
Sample documents organized by category for testing ingestion and querying:

- **`business/`** - Business-related documents
  - `startup-funding-guide.md` - Sample startup funding guide
- **`legal/`** - Legal documents (placeholder)
- **`science/`** - Scientific documents
  - `climate-change-research.md` - Climate research sample
- **`tech/`** - Technical documents
  - `kubernetes-guide.md` - Kubernetes deployment guide
  - `machine-learning-overview.md` - ML overview document

### Test Files
- **`test-upload.txt`** - Simple test file for upload functionality
- **`web-test-interface.html`** - Basic HTML interface for testing web functionality

## Usage

### Upload Test Documents
```bash
# Upload via API
curl -X POST http://localhost:8888/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "$(cat examples/test-documents/tech/kubernetes-guide.md)",
    "metadata": {"source": "kubernetes-guide.md", "category": "tech"}
  }'

# Upload via web interface
curl -X POST http://localhost:3333/api/upload \
  -F "file=@examples/test-upload.txt" \
  -F "category=general"
```

### Bulk Upload All Documents
```bash
./scripts/bulk-ingest.sh examples/test-documents/
```

### Test Queries
```bash
# Query about Kubernetes
curl -X POST http://localhost:8888/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to deploy applications with Kubernetes?",
    "topK": 3,
    "minScore": 0.7
  }'

# Query about machine learning
curl -X POST http://localhost:3333/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "topK": 5
  }'
```