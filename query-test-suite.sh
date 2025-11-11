#!/bin/bash

# Comprehensive Query Testing Suite for RAG Pipeline
# Tests various query scenarios and evaluates response quality

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:3000"
RESULTS_DIR="query-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
}

log_highlight() {
    echo -e "${PURPLE}🌟 $1${NC}"
}

# Query test scenarios
declare -A test_categories

# Technology queries
tech_queries=(
    "What is Kubernetes?"
    "How does container orchestration work?"
    "Explain machine learning algorithms"
    "What are neural networks?"
    "How does deep learning work?"
    "What is natural language processing?"
    "Explain computer vision applications"
    "What are the types of machine learning?"
    "How do transformers work in NLP?"
    "What is supervised vs unsupervised learning?"
)

# Business queries
business_queries=(
    "What are the stages of startup funding?"
    "How do venture capital firms work?"
    "What is angel investment?"
    "Explain Series A funding"
    "What is pre-seed funding?"
    "How do investors evaluate startups?"
    "What are liquidation preferences?"
    "Explain term sheet negotiations"
    "What is equity dilution?"
    "How does crowdfunding work?"
)

# Science queries
science_queries=(
    "What causes climate change?"
    "How do greenhouse gases work?"
    "What are the effects of global warming?"
    "Explain sea level rise"
    "What is ocean acidification?"
    "How does carbon dioxide affect climate?"
    "What are climate tipping points?"
    "Explain the greenhouse effect"
    "What is the IPCC?"
    "How are climate models created?"
)

# Cross-domain queries
cross_domain_queries=(
    "AI applications in climate science"
    "Machine learning for startup analytics"
    "Technology funding trends"
    "Climate data analysis"
    "Venture capital in AI"
    "Environmental technology startups"
    "Predictive models for climate"
    "Data science in business"
    "Sustainable technology investments"
    "Digital transformation in climate research"
)

# Edge case queries
edge_case_queries=(
    "quantum computing applications"
    "blockchain in agriculture"
    "space technology funding"
    "underwater basket weaving"
    "purple elephant migration patterns"
    "What is the meaning of life?"
    ""
    "a"
    "The quick brown fox jumps over the lazy dog multiple times in a very long sentence that goes on and on without much meaning"
)

# Create results directory
setup_results_dir() {
    mkdir -p "$RESULTS_DIR"
    log_info "Results will be saved to: $RESULTS_DIR"
}

# Execute query and measure performance
execute_query() {
    local query="$1"
    local category="$2"
    local top_k="${3:-5}"
    local min_score="${4:-0.1}"
    
    local start_time=$(date +%s%N)
    
    local response=$(curl -s -X POST "$API_URL/query" \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"$query\",
            \"topK\": $top_k,
            \"minScore\": $min_score
        }" 2>/dev/null)
    
    local end_time=$(date +%s%N)
    local request_time=$((($end_time - $start_time) / 1000000))
    
    # Parse response
    local success="false"
    local results_count=0
    local processing_time=0
    local error_msg=""
    local results=""
    
    if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
        success="true"
        results_count=$(echo $response | jq -r '.totalResults // 0')
        processing_time=$(echo $response | jq -r '.processingTimeMs // 0')
        results=$(echo $response | jq -r '.results // []')
    else
        error_msg=$(echo $response | jq -r '.error // "Unknown error"')
    fi
    
    # Output JSON result
    jq -n \
        --arg query "$query" \
        --arg category "$category" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg success "$success" \
        --argjson results_count "$results_count" \
        --argjson processing_time "$processing_time" \
        --argjson request_time "$request_time" \
        --arg error "$error_msg" \
        --argjson results "$results" \
        '{
            query: $query,
            category: $category,
            timestamp: $timestamp,
            success: ($success == "true"),
            results_count: $results_count,
            processing_time_ms: $processing_time,
            request_time_ms: $request_time,
            error: $error,
            results: $results
        }'
}

# Run query category tests
run_category_tests() {
    local category="$1"
    local queries=("${@:2}")
    
    echo -e "\n${CYAN}🧪 Testing $category Queries:${NC}"
    echo "$(printf '=%.0s' {1..50})"
    
    local results_file="$RESULTS_DIR/${category,,}_results_$TIMESTAMP.jsonl"
    local total_queries=${#queries[@]}
    local successful_queries=0
    local total_request_time=0
    local total_processing_time=0
    local total_results=0
    
    for i in "${!queries[@]}"; do
        local query="${queries[$i]}"
        echo -n "[$((i+1))/$total_queries] \"$query\""
        
        # Execute query
        local result=$(execute_query "$query" "$category" 5 0.1)
        echo "$result" >> "$results_file"
        
        # Parse results for summary
        local success=$(echo "$result" | jq -r '.success')
        local results_count=$(echo "$result" | jq -r '.results_count')
        local processing_time=$(echo "$result" | jq -r '.processing_time_ms')
        local request_time=$(echo "$result" | jq -r '.request_time_ms')
        
        if [[ "$success" == "true" ]]; then
            ((successful_queries++))
            total_results=$((total_results + results_count))
            total_processing_time=$((total_processing_time + processing_time))
            total_request_time=$((total_request_time + request_time))
            
            echo -e " -> ${GREEN}✅ $results_count results (${processing_time}ms)${NC}"
            
            # Show top result if available
            if [[ $results_count -gt 0 ]]; then
                local top_score=$(echo "$result" | jq -r '.results[0].score // 0')
                local top_source=$(echo "$result" | jq -r '.results[0].metadata.source // "Unknown"')
                echo "   🥇 Top: $top_source (score: $(printf "%.3f" "$top_score"))"
            fi
        else
            local error=$(echo "$result" | jq -r '.error')
            echo -e " -> ${RED}❌ $error${NC}"
        fi
        
        # Small delay to avoid overwhelming the API
        sleep 0.1
    done
    
    # Category summary
    echo -e "\n${PURPLE}📊 $category Summary:${NC}"
    echo "   Total queries: $total_queries"
    echo "   Successful: $successful_queries"
    echo "   Success rate: $(echo "scale=1; $successful_queries * 100 / $total_queries" | bc -l)%"
    
    if [[ $successful_queries -gt 0 ]]; then
        local avg_processing=$(echo "scale=1; $total_processing_time / $successful_queries" | bc -l)
        local avg_request=$(echo "scale=1; $total_request_time / $successful_queries" | bc -l)
        local avg_results=$(echo "scale=1; $total_results / $successful_queries" | bc -l)
        
        echo "   Avg processing time: ${avg_processing}ms"
        echo "   Avg request time: ${avg_request}ms"
        echo "   Avg results per query: $avg_results"
    fi
    
    echo "   📄 Results saved to: $results_file"
}

# Generate comprehensive report
generate_report() {
    local report_file="$RESULTS_DIR/comprehensive_report_$TIMESTAMP.html"
    
    log_info "Generating comprehensive test report..."
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>RAG Pipeline Query Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .category { margin-bottom: 30px; }
        .category h2 { color: #333; border-bottom: 2px solid #ddd; }
        .query-result { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #f9f9f9; }
        .success { border-left-color: #4CAF50; }
        .failure { border-left-color: #f44336; }
        .metrics { display: flex; gap: 20px; margin: 10px 0; }
        .metric { padding: 10px; background: white; border-radius: 5px; }
        .result-item { margin: 8px 0; padding: 8px; background: white; border-radius: 3px; }
        .score { font-weight: bold; color: #2196F3; }
    </style>
</head>
<body>
EOF

    echo "<div class='header'>" >> "$report_file"
    echo "<h1>🎯 RAG Pipeline Query Test Report</h1>" >> "$report_file"
    echo "<p><strong>Generated:</strong> $(date)</p>" >> "$report_file"
    echo "<p><strong>API Endpoint:</strong> $API_URL</p>" >> "$report_file"
    echo "</div>" >> "$report_file"

    # Process each category
    for results_file in "$RESULTS_DIR"/*_results_*.jsonl; do
        if [[ -f "$results_file" ]]; then
            local category=$(basename "$results_file" | cut -d'_' -f1)
            local category_title=$(echo "$category" | sed 's/.*/\u&/')
            
            echo "<div class='category'>" >> "$report_file"
            echo "<h2>📊 $category_title Queries</h2>" >> "$report_file"
            
            # Calculate category statistics
            local total_queries=$(wc -l < "$results_file")
            local successful_queries=$(jq -s 'map(select(.success == true)) | length' < "$results_file")
            local avg_processing=$(jq -s 'map(select(.success == true).processing_time_ms) | add / length' < "$results_file")
            local avg_results=$(jq -s 'map(select(.success == true).results_count) | add / length' < "$results_file")
            
            echo "<div class='metrics'>" >> "$report_file"
            echo "<div class='metric'>📝 Total: $total_queries</div>" >> "$report_file"
            echo "<div class='metric'>✅ Success: $successful_queries</div>" >> "$report_file"
            echo "<div class='metric'>⏱️ Avg Time: $(printf "%.1f" "$avg_processing")ms</div>" >> "$report_file"
            echo "<div class='metric'>📊 Avg Results: $(printf "%.1f" "$avg_results")</div>" >> "$report_file"
            echo "</div>" >> "$report_file"
            
            # Process each query result
            while IFS= read -r line; do
                local query=$(echo "$line" | jq -r '.query')
                local success=$(echo "$line" | jq -r '.success')
                local results_count=$(echo "$line" | jq -r '.results_count')
                local processing_time=$(echo "$line" | jq -r '.processing_time_ms')
                local results=$(echo "$line" | jq -r '.results')
                
                local css_class="query-result"
                if [[ "$success" == "true" ]]; then
                    css_class="$css_class success"
                else
                    css_class="$css_class failure"
                fi
                
                echo "<div class='$css_class'>" >> "$report_file"
                echo "<h4>\"$query\"</h4>" >> "$report_file"
                echo "<p><strong>Results:</strong> $results_count | <strong>Time:</strong> ${processing_time}ms</p>" >> "$report_file"
                
                if [[ "$success" == "true" && $results_count -gt 0 ]]; then
                    echo "<div class='results'>" >> "$report_file"
                    echo "$results" | jq -r '.[] | "<div class=\"result-item\"><span class=\"score\">" + (.score | tostring | .[0:5]) + "</span> - " + .metadata.source + "<br><em>" + .content[0:150] + "...</em></div>"' >> "$report_file"
                    echo "</div>" >> "$report_file"
                fi
                
                echo "</div>" >> "$report_file"
            done < "$results_file"
            
            echo "</div>" >> "$report_file"
        fi
    done

    echo "</body></html>" >> "$report_file"
    
    log_success "Comprehensive report generated: $report_file"
}

# Performance stress test
stress_test() {
    echo -e "\n${CYAN}⚡ Performance Stress Test:${NC}"
    echo "=========================="
    
    local stress_queries=(
        "machine learning"
        "kubernetes"
        "startup funding"
        "climate change"
        "neural networks"
    )
    
    local concurrent_requests=10
    local requests_per_query=20
    
    log_info "Running $requests_per_query requests per query with $concurrent_requests concurrent connections"
    
    local results_file="$RESULTS_DIR/stress_test_$TIMESTAMP.jsonl"
    
    for query in "${stress_queries[@]}"; do
        echo "🔥 Stress testing: \"$query\""
        
        # Launch concurrent requests
        for ((i=1; i<=requests_per_query; i++)); do
            {
                local result=$(execute_query "$query" "stress_test" 5 0.1)
                echo "$result" >> "$results_file"
            } &
            
            # Control concurrency
            if (( i % concurrent_requests == 0 )); then
                wait
            fi
        done
        wait
        
        echo "   ✅ Completed $requests_per_query requests"
    done
    
    # Analyze stress test results
    local total_requests=$(wc -l < "$results_file")
    local successful_requests=$(jq -s 'map(select(.success == true)) | length' < "$results_file")
    local avg_processing=$(jq -s 'map(select(.success == true).processing_time_ms) | add / length' < "$results_file")
    local max_processing=$(jq -s 'map(select(.success == true).processing_time_ms) | max' < "$results_file")
    local min_processing=$(jq -s 'map(select(.success == true).processing_time_ms) | min' < "$results_file")
    
    echo -e "\n${PURPLE}📊 Stress Test Results:${NC}"
    echo "   Total requests: $total_requests"
    echo "   Successful: $successful_requests"
    echo "   Success rate: $(echo "scale=1; $successful_requests * 100 / $total_requests" | bc -l)%"
    echo "   Avg processing time: $(printf "%.1f" "$avg_processing")ms"
    echo "   Min processing time: $(printf "%.1f" "$min_processing")ms"
    echo "   Max processing time: $(printf "%.1f" "$max_processing")ms"
}

# Main testing function
run_all_tests() {
    echo -e "${GREEN}🎯 RAG Pipeline Comprehensive Query Testing${NC}"
    echo "============================================="
    
    # Check API availability
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        log_error "RAG API is not running at $API_URL"
        echo "Please start it with: docker-compose up -d"
        exit 1
    fi
    
    # Show API status
    local response=$(curl -s "$API_URL/health/detailed")
    local embedding_model=$(echo $response | jq -r '.providers.embedding.model')
    local vector_count=$(echo $response | jq -r '.providers.vectorStore.vectorCount')
    
    echo "🔤 Embedding Model: $embedding_model"
    echo "📚 Documents Indexed: $vector_count"
    echo ""
    
    if [[ $vector_count -eq 0 ]]; then
        log_warning "No documents are indexed. Consider running document ingestion first."
        echo "Use: ./bulk-ingest.sh test-documents/"
        echo ""
    fi
    
    # Setup results directory
    setup_results_dir
    
    # Run category tests
    run_category_tests "Technology" "${tech_queries[@]}"
    run_category_tests "Business" "${business_queries[@]}"
    run_category_tests "Science" "${science_queries[@]}"
    run_category_tests "Cross-Domain" "${cross_domain_queries[@]}"
    run_category_tests "Edge-Cases" "${edge_case_queries[@]}"
    
    # Run stress test
    stress_test
    
    # Generate comprehensive report
    generate_report
    
    echo -e "\n${GREEN}🎉 Query testing completed!${NC}"
    echo "📂 Results directory: $RESULTS_DIR"
    echo "📄 Open the HTML report in your browser to view detailed results"
}

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    echo "Please install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_warning "bc is not installed, some calculations may not work properly"
fi

# Run tests
run_all_tests