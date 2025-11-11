#!/bin/bash

# Quick Start Script for RAG Pipeline Live Testing
# This script helps you get started with live testing quickly

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_highlight() {
    echo -e "${PURPLE}🌟 $1${NC}"
}

# ASCII Art Header
show_header() {
    echo -e "${CYAN}"
    cat << 'EOF'
    ____  ___   ______   ____  _            ___            
   / __ \/   | / ____/  / __ \(_)___  ___  / (_)___  ___   
  / /_/ / /| |/ / __   / /_/ / / __ \/ _ \/ / / __ \/ _ \  
 / _, _/ ___ / /_/ /  / ____/ / /_/ /  __/ / / / / /  __/  
/_/ |_/_/  |_\____/  /_/   /_/ .___/\___/_/_/_/ /_/\___/   
                           /_/                            
          Live Testing Environment Setup
EOF
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "\n${CYAN}🔧 Checking Prerequisites...${NC}"
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo -e "${YELLOW}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo ""
        echo "Please install the missing dependencies:"
        echo "  • Docker: https://docs.docker.com/get-docker/"
        echo "  • Docker Compose: https://docs.docker.com/compose/install/"
        echo "  • curl: Usually pre-installed or 'apt install curl'"
        echo "  • jq: 'brew install jq' or 'apt install jq'"
        exit 1
    fi
    
    log_success "All prerequisites are installed"
}

# Start the RAG service
start_service() {
    echo -e "\n${CYAN}🚀 Starting RAG Pipeline Service...${NC}"
    
    # Check if already running
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        log_warning "Service is already running on port 3000"
        return 0
    fi
    
    # Set API keys
    if [[ -z "$OPENAI_API_KEY" ]]; then
        export OPENAI_API_KEY="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"
    fi
    
    # Start with Docker Compose
    docker-compose up -d
    
    # Wait for service to be ready
    log_info "Waiting for service to start..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Service is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo ""
    log_warning "Service didn't start within expected time. Check logs with: docker-compose logs rag-api"
    return 1
}

# Load sample documents
load_sample_documents() {
    echo -e "\n${CYAN}📚 Loading Sample Documents...${NC}"
    
    if [[ ! -d "test-documents" ]]; then
        log_warning "No test-documents directory found. Creating sample documents..."
        # Sample documents should already be created by previous setup
        return 0
    fi
    
    # Use bulk ingestion script
    if [[ -f "bulk-ingest.sh" ]]; then
        log_info "Using bulk ingestion to load sample documents..."
        ./bulk-ingest.sh -c "sample" test-documents/
    else
        log_warning "Bulk ingestion script not found. You can manually upload documents later."
    fi
}

# Show available testing options
show_testing_options() {
    echo -e "\n${CYAN}🧪 Available Testing Options:${NC}"
    echo "================================"
    echo ""
    echo "1. 🌐 Web Interface (Recommended for beginners)"
    echo "   Open: web-test-interface.html in your browser"
    echo "   Features: Visual interface, real-time testing, document upload"
    echo ""
    echo "2. 🖥️  Interactive CLI Testing"
    echo "   Run: ./live-test.sh"
    echo "   Features: Menu-driven testing, comprehensive options"
    echo ""
    echo "3. 📄 Bulk Document Ingestion"
    echo "   Run: ./bulk-ingest.sh [directory]"
    echo "   Features: Process multiple files, batch operations"
    echo ""
    echo "4. 🧪 Comprehensive Query Testing"
    echo "   Run: ./query-test-suite.sh"
    echo "   Features: Automated testing, performance benchmarks, reports"
    echo ""
    echo "5. 🔧 Manual API Testing"
    echo "   Example commands:"
    echo "   curl -X GET http://localhost:3000/health/detailed"
    echo "   curl -X POST http://localhost:3000/query -H 'Content-Type: application/json' -d '{\"query\":\"test\"}'"
}

# Show API endpoints
show_api_info() {
    echo -e "\n${CYAN}📡 API Endpoints:${NC}"
    echo "=================="
    echo ""
    echo "🔍 Health Checks:"
    echo "  GET  /health          - Basic health check"
    echo "  GET  /health/detailed - Detailed system status"
    echo ""
    echo "📄 Document Ingestion:"
    echo "  POST /ingest          - Ingest text content"
    echo "  POST /ingest/file     - Ingest from file path"
    echo ""
    echo "🔎 Querying:"
    echo "  POST /query           - Search documents"
    echo ""
    echo "💻 Base URL: http://localhost:3000"
}

# Show current system status
show_system_status() {
    echo -e "\n${CYAN}📊 Current System Status:${NC}"
    echo "========================="
    
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "❌ Service is not running"
        return 1
    fi
    
    local response=$(curl -s http://localhost:3000/health/detailed)
    
    echo "✅ Service: Running"
    echo "🔤 Embedding Model: $(echo $response | jq -r '.providers.embedding.model')"
    echo "📐 Dimensions: $(echo $response | jq -r '.providers.embedding.dimension')"
    echo "💾 Vector Store: $(echo $response | jq -r '.providers.vectorStore.type')"
    echo "📚 Documents: $(echo $response | jq -r '.providers.vectorStore.vectorCount')"
}

# Open web interface
open_web_interface() {
    local html_file="web-test-interface.html"
    
    if [[ -f "$html_file" ]]; then
        log_info "Opening web interface..."
        
        # Try to open in default browser
        if command -v open &> /dev/null; then
            # macOS
            open "$html_file"
        elif command -v xdg-open &> /dev/null; then
            # Linux
            xdg-open "$html_file"
        elif command -v start &> /dev/null; then
            # Windows
            start "$html_file"
        else
            echo "Please open $html_file in your web browser"
        fi
        
        log_success "Web interface should open in your browser"
    else
        log_warning "Web interface file not found: $html_file"
    fi
}

# Main menu
show_main_menu() {
    while true; do
        echo -e "\n${PURPLE}🎯 What would you like to do?${NC}"
        echo "=========================="
        echo "1. 🌐 Open Web Interface"
        echo "2. 🖥️  Start Interactive CLI Testing"
        echo "3. 📄 Bulk Ingest Documents"
        echo "4. 🧪 Run Query Test Suite"
        echo "5. 📊 Show System Status"
        echo "6. 📡 Show API Information"
        echo "7. 🔄 Restart Service"
        echo "8. 🛑 Stop Service and Exit"
        echo ""
        echo -n "Choose an option (1-8): "
        read -r choice
        
        case $choice in
            1)
                open_web_interface
                ;;
            2)
                if [[ -f "live-test.sh" ]]; then
                    ./live-test.sh
                else
                    log_warning "live-test.sh not found"
                fi
                ;;
            3)
                if [[ -f "bulk-ingest.sh" ]]; then
                    echo -n "Enter directory path (or press Enter for test-documents/): "
                    read -r dir
                    dir=${dir:-test-documents/}
                    ./bulk-ingest.sh "$dir"
                else
                    log_warning "bulk-ingest.sh not found"
                fi
                ;;
            4)
                if [[ -f "query-test-suite.sh" ]]; then
                    ./query-test-suite.sh
                else
                    log_warning "query-test-suite.sh not found"
                fi
                ;;
            5)
                show_system_status
                ;;
            6)
                show_api_info
                ;;
            7)
                echo "🔄 Restarting service..."
                docker-compose restart
                sleep 5
                show_system_status
                ;;
            8)
                echo "🛑 Stopping service..."
                docker-compose down
                log_success "Service stopped. Goodbye! 👋"
                exit 0
                ;;
            *)
                log_warning "Invalid choice. Please select 1-8."
                ;;
        esac
    done
}

# Main function
main() {
    show_header
    
    check_prerequisites
    start_service
    
    # Show initial status
    show_system_status
    show_testing_options
    
    # Optionally load sample documents
    echo ""
    echo -n "Would you like to load sample documents for testing? (Y/n): "
    read -r load_samples
    
    if [[ "$load_samples" != "n" ]] && [[ "$load_samples" != "N" ]]; then
        load_sample_documents
    fi
    
    # Start interactive menu
    show_main_menu
}

# Run main function
main