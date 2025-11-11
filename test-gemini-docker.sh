#!/bin/bash

# Test Gemini embeddings in Docker deployment
# This script tests switching to Gemini provider

set -e

echo "🔄 Testing Gemini Embeddings Docker Deployment"
echo "=============================================="

# Stop current deployment
echo "📥 Stopping current deployment..."
docker-compose down

# Update docker-compose for Gemini
echo "🔧 Configuring for Gemini embeddings..."
sed -i.bak 's/EMBEDDING_PROVIDER: openai/EMBEDDING_PROVIDER: gemini/' docker-compose.yml
sed -i.bak 's/EMBEDDING_DIMENSION: 1536/EMBEDDING_DIMENSION: 768/' docker-compose.yml
sed -i.bak 's/OPENAI_API_KEY: \${OPENAI_API_KEY}/GEMINI_API_KEY: \${GEMINI_API_KEY}/' docker-compose.yml
sed -i.bak 's/EMBEDDING_MODEL: text-embedding-3-small/GEMINI_MODEL: text-embedding-004/' docker-compose.yml

# Start with Gemini
echo "🚀 Starting deployment with Gemini..."
GEMINI_API_KEY=AIzaSyA-1so-fKevR8fkbb0Owa0xIFoujyJiKqg docker-compose up -d

# Wait and test
echo "⏳ Waiting for API..."
sleep 15

# Test health with Gemini
echo "🔍 Testing Gemini health..."
response=$(curl -s "http://localhost:3000/health/detailed")
if [[ $response == *"text-embedding-004"* ]] && [[ $response == *"768"* ]]; then
    echo "✅ Gemini provider working correctly!"
    echo "   Model: $(echo $response | jq -r '.providers.embedding.model')"
    echo "   Dimensions: $(echo $response | jq -r '.providers.embedding.dimension')"
else
    echo "❌ Gemini test failed: $response"
    exit 1
fi

# Test ingestion with Gemini
echo "📄 Testing Gemini ingestion..."
response=$(curl -s -X POST "http://localhost:3000/ingest" \
    -H "Content-Type: application/json" \
    -d '{"content": "Google Gemini is a powerful AI model for text understanding and generation.", "metadata": {"source": "gemini-test"}}')

if [[ $response == *"success"* ]]; then
    echo "✅ Gemini ingestion successful!"
else
    echo "❌ Gemini ingestion failed: $response"
    exit 1
fi

# Test query with Gemini
echo "🔍 Testing Gemini query..."
response=$(curl -s -X POST "http://localhost:3000/query" \
    -H "Content-Type: application/json" \
    -d '{"query": "What is Gemini AI?", "topK": 3}')

if [[ $response == *"success"* ]] && [[ $response == *"Gemini"* ]]; then
    echo "✅ Gemini query successful!"
    results=$(echo $response | jq -r '.totalResults')
    echo "   Results: $results"
else
    echo "❌ Gemini query failed: $response"
    exit 1
fi

echo ""
echo "🎉 Gemini Docker deployment test successful!"
echo "=============================================="

# Restore original configuration
echo "🔄 Restoring OpenAI configuration..."
mv docker-compose.yml.bak docker-compose.yml

echo "✅ Test completed successfully!"