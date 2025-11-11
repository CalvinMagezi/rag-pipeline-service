# Scripts

This directory contains utility scripts for testing, deployment, and development automation.

## Available Scripts

### Development & Testing
- **`bulk-ingest.sh`** - Bulk ingest multiple documents for testing
- **`live-test.sh`** - Live testing script for API endpoints  
- **`query-test-suite.sh`** - Comprehensive query testing suite
- **`start-live-testing.sh`** - Start live testing environment
- **`test-gemini-docker.sh`** - Test Gemini provider in Docker

### Deployment & Infrastructure
- **`test-docker-deployment.sh`** - Test complete Docker deployment

## Usage

Make scripts executable before running:
```bash
chmod +x scripts/*.sh
```

Run from project root:
```bash
# Test Docker deployment
./scripts/test-docker-deployment.sh

# Bulk ingest documents
./scripts/bulk-ingest.sh

# Run query test suite
./scripts/query-test-suite.sh
```

## Prerequisites

- Docker and Docker Compose installed
- Valid API keys in `.env` file
- Running RAG Pipeline services