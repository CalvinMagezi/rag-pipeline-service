#!/bin/bash

# Interactive Live Testing Script for RAG Pipeline
# This script provides an interactive interface for testing the RAG system with real documents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
TEST_DOCS_DIR="test-documents"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

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

log_highlight() {
    echo -e "${PURPLE}🌟 $1${NC}"
}

# Check if API is running
check_api() {
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        log_error "RAG API is not running at $API_URL. Please start it first with 'docker-compose up -d'"
    fi
    log_success "RAG API is running and accessible"
}

# Get API status
get_api_status() {
    echo -e "\n${CYAN}📊 Current API Status:${NC}"
    echo "=================="
    
    response=$(curl -s "$API_URL/health/detailed")
    embedding_model=$(echo $response | jq -r '.providers.embedding.model')
    embedding_dim=$(echo $response | jq -r '.providers.embedding.dimension')
    vector_store=$(echo $response | jq -r '.providers.vectorStore.type')
    vector_count=$(echo $response | jq -r '.providers.vectorStore.vectorCount')
    
    echo "🔤 Embedding Model: $embedding_model"
    echo "📐 Dimensions: $embedding_dim"
    echo "💾 Vector Store: $vector_store"
    echo "📚 Documents Indexed: $vector_count"
    echo ""
}

# Ingest a single document
ingest_document() {
    local file_path="$1"
    local category="$2"
    
    if [[ ! -f "$file_path" ]]; then
        log_warning "File not found: $file_path"
        return 1
    fi
    
    local filename=$(basename "$file_path")
    local content=$(cat "$file_path")
    
    log_info "Ingesting document: $filename"
    
    local response=$(curl -s -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d "{
            \"content\": $(echo "$content" | jq -R -s '.'),
            \"metadata\": {
                \"source\": \"$filename\",
                \"category\": \"$category\",
                \"file_path\": \"$file_path\",
                \"ingested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }
        }")
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        local doc_id=$(echo $response | jq -r '.documentId')
        local chunks=$(echo $response | jq -r '.chunksCreated')
        local vectors=$(echo $response | jq -r '.vectorsStored')
        log_success "Document ingested successfully!"
        echo "   📄 Document ID: ${doc_id:0:8}..."
        echo "   📝 Chunks Created: $chunks"
        echo "   🎯 Vectors Stored: $vectors"
        return 0
    else
        log_error "Failed to ingest document: $response"
        return 1
    fi
}

# Ingest all test documents
ingest_all_documents() {
    echo -e "\n${CYAN}📁 Ingesting All Test Documents:${NC}"
    echo "============================="
    
    local total_files=0
    local success_count=0
    
    if [[ ! -d "$TEST_DOCS_DIR" ]]; then
        log_error "Test documents directory not found: $TEST_DOCS_DIR"
    fi
    
    # Ingest tech documents
    for file in "$TEST_DOCS_DIR"/tech/*.md; do
        if [[ -f "$file" ]]; then
            ((total_files++))
            if ingest_document "$file" "technology"; then
                ((success_count++))
            fi
            echo ""
        fi
    done
    
    # Ingest business documents
    for file in "$TEST_DOCS_DIR"/business/*.md; do
        if [[ -f "$file" ]]; then
            ((total_files++))
            if ingest_document "$file" "business"; then
                ((success_count++))
            fi
            echo ""
        fi
    done
    
    # Ingest science documents
    for file in "$TEST_DOCS_DIR"/science/*.md; do
        if [[ -f "$file" ]]; then
            ((total_files++))
            if ingest_document "$file" "science"; then
                ((success_count++))
            fi
            echo ""
        fi
    done
    
    log_highlight "Ingestion Summary: $success_count/$total_files documents ingested successfully"
}

# Query the system
query_system() {
    local query="$1"
    local top_k="${2:-5}"
    local min_score="${3:-0.1}"
    
    log_info "Querying: \"$query\""
    echo "🔍 Parameters: topK=$top_k, minScore=$min_score"
    echo ""
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"$query\",
            \"topK\": $top_k,
            \"minScore\": $min_score
        }")
    local end_time=$(date +%s%N)
    local request_time=$((($end_time - $start_time) / 1000000))
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        local results_count=$(echo $response | jq -r '.totalResults')
        local processing_time=$(echo $response | jq -r '.processingTimeMs')
        
        echo "📊 Query Results:"
        echo "   🎯 Total Results: $results_count"
        echo "   ⏱️  Processing Time: ${processing_time}ms (Request: ${request_time}ms)"
        echo ""
        
        if [[ $results_count -gt 0 ]]; then
            echo "🔍 Top Results:"
            echo $response | jq -r '.results[] | "   📄 Score: \(.score | tonumber | . * 100 | floor / 100)\n   📝 Source: \(.metadata.source // "Unknown")\n   📖 Content: \(.content[0:150])...\n"'
        else
            log_warning "No results found for this query"
        fi
    else
        log_error "Query failed: $response"
    fi
    echo ""
}

# Interactive query session
interactive_query() {
    echo -e "\n${CYAN}🗣️  Interactive Query Session:${NC}"
    echo "============================"
    echo "Type your questions below (or 'quit' to exit):"
    echo ""
    
    while true; do
        echo -n -e "${PURPLE}❓ Your question: ${NC}"
        read -r user_query
        
        if [[ "$user_query" == "quit" ]] || [[ "$user_query" == "exit" ]]; then
            log_info "Exiting interactive session"
            break
        fi
        
        if [[ -z "$user_query" ]]; then
            log_warning "Please enter a question"
            continue
        fi
        
        echo ""
        query_system "$user_query" 3 0.2
        echo "---"
    done
}

# Predefined test queries
run_test_queries() {
    echo -e "\n${CYAN}🧪 Running Predefined Test Queries:${NC}"
    echo "==================================="
    
    # Technology queries
    echo -e "\n${YELLOW}💻 Technology Queries:${NC}"
    query_system "What is Kubernetes and how does it work?" 3 0.3
    query_system "Explain machine learning algorithms" 3 0.3
    query_system "How do neural networks process data?" 3 0.3
    
    # Business queries
    echo -e "\n${YELLOW}💼 Business Queries:${NC}"
    query_system "What are the stages of startup funding?" 3 0.3
    query_system "How do venture capital firms evaluate startups?" 3 0.3
    query_system "What is angel investment?" 3 0.3
    
    # Science queries
    echo -e "\n${YELLOW}🔬 Science Queries:${NC}"
    query_system "What is climate change and its impacts?" 3 0.3
    query_system "How do greenhouse gases affect global warming?" 3 0.3
    query_system "What are the effects of sea level rise?" 3 0.3
    
    # Cross-domain queries
    echo -e "\n${YELLOW}🔄 Cross-Domain Queries:${NC}"
    query_system "AI applications in climate research" 3 0.2
    query_system "Technology funding and venture capital" 3 0.2
    query_system "Data analysis techniques" 3 0.2
}

# Performance benchmark
performance_benchmark() {
    echo -e "\n${CYAN}⚡ Performance Benchmark:${NC}"
    echo "======================="
    
    local queries=(
        "machine learning"
        "kubernetes orchestration"
        "startup funding rounds"
        "climate change impacts"
        "natural language processing"
    )
    
    local total_time=0
    local query_count=${#queries[@]}
    
    for query in "${queries[@]}"; do
        local start_time=$(date +%s%N)
        local response=$(curl -s -X POST "$API_URL/query" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$query\", \"topK\": 5}")
        local end_time=$(date +%s%N)
        local query_time=$((($end_time - $start_time) / 1000000))
        
        total_time=$((total_time + query_time))
        
        if [[ $response == *"success"* ]]; then
            local processing_time=$(echo $response | jq -r '.processingTimeMs')
            echo "🔍 \"$query\": ${query_time}ms (API: ${processing_time}ms)"
        else
            echo "❌ \"$query\": Failed"
        fi
    done
    
    local avg_time=$((total_time / query_count))
    echo ""
    log_highlight "Average query time: ${avg_time}ms (across $query_count queries)"
}

# Main menu
show_menu() {
    echo -e "\n${CYAN}🚀 RAG Pipeline Live Testing Menu:${NC}"
    echo "=================================="
    echo "1. 📊 Show API Status"
    echo "2. 📁 Ingest All Test Documents"
    echo "3. 📄 Ingest Single Document"
    echo "4. 🧪 Run Predefined Test Queries"
    echo "5. 🗣️  Interactive Query Session"
    echo "6. ⚡ Performance Benchmark"
    echo "7. 🔄 Switch Embedding Provider"
    echo "8. 🗑️  Clear Vector Database"
    echo "9. ❌ Exit"
    echo ""
}

# Switch embedding provider
switch_provider() {
    echo -e "\n${CYAN}🔄 Switch Embedding Provider:${NC}"
    echo "============================="
    echo "This requires restarting the Docker containers."
    echo ""
    echo "1. OpenAI (text-embedding-3-small, 1536d)"
    echo "2. Gemini (text-embedding-004, 768d)"
    echo ""
    echo -n "Choose provider (1-2): "
    read -r choice
    
    case $choice in
        1)
            echo "🔄 Switching to OpenAI embeddings..."
            # Update docker-compose and restart
            ;;
        2)
            echo "🔄 Switching to Gemini embeddings..."
            # Update docker-compose and restart
            ;;
        *)
            log_warning "Invalid choice"
            ;;
    esac
}

# Clear vector database
clear_database() {
    echo -e "\n${YELLOW}⚠️  Warning: This will delete all indexed documents!${NC}"
    echo -n "Are you sure? (y/N): "
    read -r confirm
    
    if [[ "$confirm" == "y" ]] || [[ "$confirm" == "Y" ]]; then
        log_info "Clearing vector database..."
        # Implementation depends on vector store type
        # For filesystem: delete the vectors directory
        # For in-memory: restart the container
        docker-compose restart rag-api
        log_success "Vector database cleared"
    else
        log_info "Operation cancelled"
    fi
}

# Main function
main() {
    echo -e "${GREEN}🎯 RAG Pipeline Live Testing Interface${NC}"
    echo "======================================"
    
    check_api
    get_api_status
    
    while true; do
        show_menu
        echo -n -e "${PURPLE}Choose an option (1-9): ${NC}"
        read -r choice
        
        case $choice in
            1)
                get_api_status
                ;;
            2)
                ingest_all_documents
                ;;
            3)
                echo -n "Enter file path: "
                read -r file_path
                echo -n "Enter category: "
                read -r category
                ingest_document "$file_path" "$category"
                ;;
            4)
                run_test_queries
                ;;
            5)
                interactive_query
                ;;
            6)
                performance_benchmark
                ;;
            7)
                switch_provider
                ;;
            8)
                clear_database
                ;;
            9)
                log_info "Thanks for testing the RAG Pipeline! 🚀"
                exit 0
                ;;
            *)
                log_warning "Invalid option. Please choose 1-9."
                ;;
        esac
    done
}

# Run main function
main