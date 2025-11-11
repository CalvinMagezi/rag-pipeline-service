# Documentation

This directory contains comprehensive documentation for the RAG Pipeline Service.

## 📖 Available Documents

### Core Documentation
- **[API.md](API.md)** - Complete REST API reference with examples
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Docker deployment guide and configuration

### Quick Links
- **[Project README](../README.md)** - Main project overview and quick start
- **[Scripts Documentation](../scripts/README.md)** - Development and testing scripts
- **[Examples](../examples/README.md)** - Sample documents and usage examples

## 📋 Quick Reference

### Getting Started
1. **Deploy with Docker**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)
2. **API Reference**: See [API.md](API.md) for endpoints
3. **Test Examples**: Use files in [../examples/](../examples/)

### Key URLs (Default Docker Setup)
- **Web Interface**: http://localhost:3333
- **RAG API**: http://localhost:8888  
- **Status Check**: http://localhost:3333/api/status

### Common Tasks

#### Upload Document
```bash
curl -X POST http://localhost:3333/api/upload \
  -F "file=@examples/test-upload.txt" \
  -F "category=technology"
```

#### Query Documents  
```bash
curl -X POST http://localhost:3333/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Docker containers", "topK": 3}'
```

#### Check System Status
```bash
curl http://localhost:3333/api/status
```

## 🔧 Configuration

### Environment Variables
Required in `.env` file:
- `EMBEDDING_PROVIDER` - Choose 'gemini' or 'openai'
- `GEMINI_API_KEY` or `OPENAI_API_KEY` - API credentials
- `VECTOR_STORE_PROVIDER` - Usually 'filesystem'

### Port Configuration
- Web App: 3333 (configurable via docker-compose.yml)
- RAG API: 8888 (configurable via docker-compose.yml)

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Check `lsof -i :3333` and `lsof -i :8888`
2. **API key errors**: Verify keys in `.env` and restart containers
3. **Vector dimension mismatch**: Clear volume with `docker volume rm rag-pipeline-service_rag-data`

### Getting Help

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
- Review [API.md](API.md) for endpoint specifications
- Test with examples from [../examples/](../examples/)

## 🚀 Next Steps

1. **Production Setup**: Configure external vector stores and proper secrets management
2. **Monitoring**: Add logging and health monitoring
3. **Security**: Implement authentication and rate limiting
4. **Scale**: Add load balancing and horizontal scaling