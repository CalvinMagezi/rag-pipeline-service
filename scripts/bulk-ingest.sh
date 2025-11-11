#!/bin/bash

# Bulk Document Ingestion Script for RAG Pipeline
# Supports multiple file formats and batch processing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:3000"
MAX_CONCURRENT=5
DELAY_BETWEEN_REQUESTS=0.5

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

# Progress tracking
declare -A processing_stats
processing_stats[total]=0
processing_stats[success]=0
processing_stats[failed]=0
processing_stats[skipped]=0

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] <directory_or_file>"
    echo ""
    echo "Options:"
    echo "  -r, --recursive       Process directories recursively"
    echo "  -f, --format FORMAT   Specify file format (md, txt, pdf, json)"
    echo "  -c, --category CAT    Set category for all documents"
    echo "  -t, --threads N       Number of concurrent requests (default: 5)"
    echo "  -d, --delay N         Delay between requests in seconds (default: 0.5)"
    echo "  -v, --verbose         Verbose output"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 documents/                              # Ingest all supported files"
    echo "  $0 -r -f md documents/                     # Recursively ingest only .md files"
    echo "  $0 -c technology tech-docs/               # Set category to 'technology'"
    echo "  $0 -t 10 -d 0.1 large-dataset/           # 10 concurrent, 0.1s delay"
}

# Check if file is supported
is_supported_file() {
    local file="$1"
    local format="$2"
    
    if [[ -n "$format" ]]; then
        [[ "${file,,}" == *".$format" ]]
        return
    fi
    
    case "${file,,}" in
        *.md|*.markdown|*.txt|*.pdf|*.json)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Extract metadata from file
extract_metadata() {
    local file="$1"
    local category="$2"
    
    local filename=$(basename "$file")
    local extension="${filename##*.}"
    local size=$(wc -c < "$file" 2>/dev/null || echo "0")
    local modified=$(date -r "$file" -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
    
    echo "{
        \"source\": \"$filename\",
        \"file_path\": \"$file\",
        \"file_type\": \"$extension\",
        \"file_size\": $size,
        \"category\": \"${category:-unknown}\",
        \"ingested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"modified_at\": \"$modified\"
    }"
}

# Ingest a single file
ingest_file() {
    local file="$1"
    local category="$2"
    local verbose="$3"
    
    if [[ ! -f "$file" ]]; then
        log_warning "File not found: $file"
        ((processing_stats[skipped]++))
        return 1
    fi
    
    # Check file size (limit to 10MB for now)
    local size=$(wc -c < "$file")
    if [[ $size -gt 10485760 ]]; then
        log_warning "File too large (>10MB): $file"
        ((processing_stats[skipped]++))
        return 1
    fi
    
    local filename=$(basename "$file")
    if [[ "$verbose" == "true" ]]; then
        log_info "Processing: $filename"
    fi
    
    # Read file content
    local content
    if ! content=$(cat "$file" 2>/dev/null); then
        log_error "Cannot read file: $file"
        ((processing_stats[failed]++))
        return 1
    fi
    
    # Extract metadata
    local metadata=$(extract_metadata "$file" "$category")
    
    # Prepare request
    local request_data=$(jq -n \
        --arg content "$content" \
        --argjson metadata "$metadata" \
        '{content: $content, metadata: $metadata}')
    
    # Make API request
    local response
    if response=$(curl -s -X POST "$API_URL/ingest" \
        -H "Content-Type: application/json" \
        -d "$request_data" 2>/dev/null); then
        
        if [[ $response == *"success"* ]] && [[ $response == *"true"* ]]; then
            local doc_id=$(echo "$response" | jq -r '.documentId // "unknown"')
            local chunks=$(echo "$response" | jq -r '.chunksCreated // 0')
            
            if [[ "$verbose" == "true" ]]; then
                log_success "$filename -> ${doc_id:0:8}... ($chunks chunks)"
            fi
            ((processing_stats[success]++))
            return 0
        else
            local error_msg=$(echo "$response" | jq -r '.error // "Unknown error"')
            if [[ "$verbose" == "true" ]]; then
                log_error "$filename: $error_msg"
            fi
            ((processing_stats[failed]++))
            return 1
        fi
    else
        if [[ "$verbose" == "true" ]]; then
            log_error "$filename: API request failed"
        fi
        ((processing_stats[failed]++))
        return 1
    fi
}

# Process files with concurrency control
process_files() {
    local files=("$@")
    local concurrent_jobs=0
    local max_concurrent="$1"
    local delay="$2"
    local category="$3"
    local verbose="$4"
    
    # Remove configuration parameters from files array
    files=("${files[@]:4}")
    
    log_info "Processing ${#files[@]} files with max $max_concurrent concurrent jobs..."
    echo ""
    
    local start_time=$(date +%s)
    
    for file in "${files[@]}"; do
        # Wait if we've reached max concurrent jobs
        while [[ $concurrent_jobs -ge $max_concurrent ]]; do
            wait -n  # Wait for any background job to finish
            ((concurrent_jobs--))
        done
        
        # Start background job
        {
            ingest_file "$file" "$category" "$verbose"
        } &
        
        ((concurrent_jobs++))
        ((processing_stats[total]++))
        
        # Show progress
        if [[ $((processing_stats[total] % 10)) -eq 0 ]] || [[ "$verbose" == "true" ]]; then
            local current_total=$((processing_stats[success] + processing_stats[failed] + processing_stats[skipped]))
            echo -ne "\r📊 Progress: $current_total/${#files[@]} (✅${processing_stats[success]} ❌${processing_stats[failed]} ⏭️${processing_stats[skipped]})"
        fi
        
        # Delay between requests
        if [[ $(echo "$delay > 0" | bc -l) -eq 1 ]]; then
            sleep "$delay"
        fi
    done
    
    # Wait for all remaining jobs
    wait
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "\n"
    log_success "Batch processing completed in ${duration}s"
    echo "📊 Summary:"
    echo "   📁 Total files: ${#files[@]}"
    echo "   ✅ Successfully ingested: ${processing_stats[success]}"
    echo "   ❌ Failed: ${processing_stats[failed]}"
    echo "   ⏭️  Skipped: ${processing_stats[skipped]}"
    
    if [[ ${processing_stats[success]} -gt 0 ]]; then
        local avg_time=$(echo "scale=2; $duration / ${processing_stats[success]}" | bc -l)
        echo "   ⚡ Average time per file: ${avg_time}s"
    fi
}

# Find files recursively
find_files() {
    local directory="$1"
    local recursive="$2"
    local format="$3"
    
    local files=()
    
    if [[ "$recursive" == "true" ]]; then
        while IFS= read -r -d '' file; do
            if is_supported_file "$file" "$format"; then
                files+=("$file")
            fi
        done < <(find "$directory" -type f -print0 2>/dev/null)
    else
        for file in "$directory"/*; do
            if [[ -f "$file" ]] && is_supported_file "$file" "$format"; then
                files+=("$file")
            fi
        done
    fi
    
    printf '%s\n' "${files[@]}"
}

# Check API availability
check_api() {
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        log_error "RAG API is not running at $API_URL"
        echo "Please start it first with: docker-compose up -d"
        exit 1
    fi
}

# Main function
main() {
    local recursive=false
    local format=""
    local category=""
    local max_concurrent=5
    local delay=0.5
    local verbose=false
    local target=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--recursive)
                recursive=true
                shift
                ;;
            -f|--format)
                format="$2"
                shift 2
                ;;
            -c|--category)
                category="$2"
                shift 2
                ;;
            -t|--threads)
                max_concurrent="$2"
                shift 2
                ;;
            -d|--delay)
                delay="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                target="$1"
                shift
                ;;
        esac
    done
    
    # Validate arguments
    if [[ -z "$target" ]]; then
        log_error "Please specify a directory or file to process"
        show_usage
        exit 1
    fi
    
    if [[ ! -e "$target" ]]; then
        log_error "Path does not exist: $target"
        exit 1
    fi
    
    # Check API
    check_api
    
    # Collect files to process
    local files=()
    
    if [[ -f "$target" ]]; then
        # Single file
        if is_supported_file "$target" "$format"; then
            files=("$target")
        else
            log_error "File format not supported: $target"
            exit 1
        fi
    elif [[ -d "$target" ]]; then
        # Directory
        mapfile -t files < <(find_files "$target" "$recursive" "$format")
        
        if [[ ${#files[@]} -eq 0 ]]; then
            log_warning "No supported files found in: $target"
            exit 1
        fi
    else
        log_error "Invalid path: $target"
        exit 1
    fi
    
    # Show configuration
    echo "🚀 Bulk Document Ingestion"
    echo "=========================="
    echo "📂 Target: $target"
    echo "📁 Files found: ${#files[@]}"
    echo "🔄 Recursive: $recursive"
    echo "📝 Format filter: ${format:-all supported}"
    echo "🏷️  Category: ${category:-auto-detect}"
    echo "🧵 Max concurrent: $max_concurrent"
    echo "⏱️  Delay: ${delay}s"
    echo ""
    
    # Confirm before processing
    echo -n "Proceed with ingestion? (y/N): "
    read -r confirm
    
    if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
    
    # Process files
    process_files "$max_concurrent" "$delay" "$category" "$verbose" "${files[@]}"
}

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    echo "Please install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_warning "bc is not installed, some calculations may not work"
fi

# Run main function
main "$@"