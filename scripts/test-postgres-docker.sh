#!/bin/bash
set -e

echo "🐘 Testing PostgreSQL Vector Store with Docker"
echo "=============================================="
echo ""

# Check if docker-compose is running
if ! docker ps | grep -q "rag-postgres"; then
    echo "📦 Starting PostgreSQL container..."
    docker-compose up -d postgres
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
else
    echo "✅ PostgreSQL container is already running"
fi

# Wait for PostgreSQL to be healthy
echo "🔍 Checking PostgreSQL health..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U raguser -d ragdb > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to become ready in time"
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 1
done

echo ""
echo "📊 Testing pgvector extension..."
docker-compose exec -T postgres psql -U raguser -d ragdb -c "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null 2>&1
docker-compose exec -T postgres psql -U raguser -d ragdb -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"

echo ""
echo "🧪 Running vector store integration tests..."
echo ""

# Set environment variables for the test script
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=raguser
export POSTGRES_PASSWORD=ragpassword
export POSTGRES_DB=ragdb

# Run the test script
pnpm tsx scripts/test-postgres-vector-store.ts

echo ""
echo "✨ PostgreSQL vector store tests completed!"
echo ""
echo "💡 To view PostgreSQL logs:"
echo "   docker-compose logs postgres"
echo ""
echo "💡 To connect to PostgreSQL:"
echo "   docker-compose exec postgres psql -U raguser -d ragdb"
echo ""
echo "💡 To stop PostgreSQL:"
echo "   docker-compose down"
