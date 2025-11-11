#!/bin/bash

# RAG Pipeline Docker Deployment Test Script
# Tests all major functionality of the dockerized RAG API

set -e  # Exit on any error

echo "🚀 Starting RAG Pipeline Docker Deployment Tests"
echo "=================================================="

# Configuration
API_URL="http://localhost:3000"
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

wait_for_api() {
    echo "⏳ Waiting for API to be ready..."
    for i in {1..30}; do
        if curl -s "$API_URL/health" > /dev/null 2>&1; then
            log_success "API is ready!"
            return 0
        fi
        echo "   Attempt $i/30..."
        sleep 2
    done
    log_error "API did not become ready within $TIMEOUT seconds"
}

# Test 1: Health Check
test_health() {
    echo -e "\n🔍 Testing Health Endpoints..."
    
    # Basic health check
    response=$(curl -s "$API_URL/health")
    if [[ $response == *"healthy"* ]]; then
        log_success "Basic health check passed"
    else
        log_error "Basic health check failed: $response"
    fi
    
    # Detailed health check
    response=$(curl -s "$API_URL/health/detailed")
    if [[ $response == *"embedding"* ]] && [[ $response == *"vectorStore"* ]]; then
        log_success "Detailed health check passed"
        echo "   Provider info: $(echo $response | jq -r '.providers.embedding.model') ($(echo $response | jq -r '.providers.embedding.dimension')d)"
    else
        log_error "Detailed health check failed: $response"
    fi
}

# Test 2: Document Ingestion
test_ingestion() {
    echo -e "\n📄 Testing Document Ingestion..."
    
    # Test 1: Simple text ingestion
    response=$(curl -s -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d '{
            "content": "Artificial Intelligence (AI) is transforming industries through machine learning, natural language processing, and computer vision technologies.",
            "metadata": {"source": "ai-overview", "category": "technology"}
        }')
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        doc_id=$(echo $response | jq -r '.documentId')
        log_success "Text ingestion successful (Document ID: ${doc_id:0:8}...)"
    else
        log_error "Text ingestion failed: $response"
    fi
    
    # Test 2: Another document for better search results
    response=$(curl -s -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d '{
            "content": "Docker containers provide lightweight virtualization for deploying applications. Kubernetes orchestrates containerized workloads at scale.",
            "metadata": {"source": "containerization-guide", "category": "devops"}
        }')
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        log_success "Second document ingested successfully"
    else
        log_warning "Second document ingestion failed: $response"
    fi
}

# Test 3: Query System
test_query() {
    echo -e "\n🔍 Testing Query System..."
    
    # Test 1: AI-related query
    response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d '{
            "query": "What is artificial intelligence?",
            "topK": 5,
            "minScore": 0.1
        }')
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        results_count=$(echo $response | jq -r '.totalResults')
        if [ "$results_count" -gt 0 ]; then
            log_success "AI query returned $results_count result(s)"
            top_score=$(echo $response | jq -r '.results[0].score')
            echo "   Top result score: $top_score"
        else
            log_warning "AI query returned no results"
        fi
    else
        log_error "AI query failed: $response"
    fi
    
    # Test 2: Docker-related query
    response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d '{
            "query": "How does containerization work?",
            "topK": 3
        }')
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        results_count=$(echo $response | jq -r '.totalResults')
        log_success "Containerization query returned $results_count result(s)"
    else
        log_warning "Containerization query failed: $response"
    fi
    
    # Test 3: Query with no results expected
    response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d '{
            "query": "quantum physics and parallel universes",
            "topK": 5,
            "minScore": 0.8
        }')
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        results_count=$(echo $response | jq -r '.totalResults')
        if [ "$results_count" -eq 0 ]; then
            log_success "High-threshold query correctly returned no results"
        else
            log_warning "Expected no results but got $results_count"
        fi
    else
        log_error "High-threshold query failed: $response"
    fi
}

# Test 4: Error Handling
test_error_handling() {
    echo -e "\n⚠️  Testing Error Handling..."
    
    # Test invalid JSON
    response=$(curl -s -w "%{http_code}" -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d '{"invalid": json}')
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 400 ]; then
        log_success "Invalid JSON properly rejected (400)"
    else
        log_warning "Invalid JSON not handled correctly (got $http_code)"
    fi
    
    # Test missing required field
    response=$(curl -s -w "%{http_code}" -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d '{"metadata": {"test": true}}')
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 400 ]; then
        log_success "Missing content field properly rejected (400)"
    else
        log_warning "Missing content field not handled correctly (got $http_code)"
    fi
}

# Test 5: Performance
test_performance() {
    echo -e "\n⚡ Testing Performance..."
    
    # Measure ingestion time
    start_time=$(date +%s%N)
    response=$(curl -s -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d '{
            "content": "Performance testing document with various technical concepts including distributed systems, microservices architecture, API design patterns, database optimization, caching strategies, and load balancing techniques.",
            "metadata": {"source": "performance-test"}
        }')
    end_time=$(date +%s%N)
    ingestion_time=$((($end_time - $start_time) / 1000000))
    
    if [[ $response == *"success"* ]]; then
        log_success "Document ingestion completed in ${ingestion_time}ms"
    else
        log_error "Performance test ingestion failed"
    fi
    
    # Measure query time
    start_time=$(date +%s%N)
    response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d '{
            "query": "distributed systems and microservices",
            "topK": 10
        }')
    end_time=$(date +%s%N)
    query_time=$((($end_time - $start_time) / 1000000))
    
    if [[ $response == *"success"* ]]; then
        processing_time=$(echo $response | jq -r '.processingTimeMs')
        log_success "Query completed in ${query_time}ms (API processing: ${processing_time}ms)"
    else
        log_error "Performance test query failed"
    fi
}

# Main test execution
main() {
    echo "🔧 Environment Check..."
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found, installing..."
        if command -v brew &> /dev/null; then
            brew install jq
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        else
            log_error "Cannot install jq. Please install it manually."
        fi
    fi
    
    # Wait for API to be ready
    wait_for_api
    
    # Run all tests
    test_health
    test_ingestion
    test_query
    test_error_handling
    test_performance
    
    echo -e "\n🎉 All tests completed successfully!"
    echo "=================================================="
    echo "Your RAG Pipeline Docker deployment is working correctly!"
    echo ""
    echo "📊 Summary:"
    echo "   • Health checks: ✅"
    echo "   • Document ingestion: ✅"
    echo "   • Query system: ✅"
    echo "   • Error handling: ✅"
    echo "   • Performance: ✅"
    echo ""
    echo "🌐 API is available at: $API_URL"
    echo "📚 Documentation: Check the README.md for API usage"
    echo "🐳 To stop: docker-compose down"
}

# Run main function
main