#!/usr/bin/env tsx
/**
 * Test script for PostgreSQL vector store integration
 * This script tests the basic CRUD operations of the PostgreSQL vector store
 *
 * Usage:
 *   pnpm tsx scripts/test-postgres-vector-store.ts
 *
 * Prerequisites:
 *   - PostgreSQL with pgvector extension running
 *   - Environment variables set (POSTGRES_HOST, POSTGRES_PASSWORD, etc.)
 */

import { PostgresVectorStore } from '../packages/rag-providers/src/implementations/vector-stores/postgres.store';
import { Vector } from '../packages/rag-core/src/types';

async function testPostgresVectorStore() {
  console.log('🧪 Testing PostgreSQL Vector Store Integration\n');

  // Configuration from environment or defaults
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'ragdb',
    user: process.env.POSTGRES_USER || 'raguser',
    password: process.env.POSTGRES_PASSWORD || 'ragpassword',
    table: 'test_vectors',
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Table: ${config.table}\n`);

  const store = new PostgresVectorStore(config);

  try {
    // Test 1: Initialize
    console.log('1️⃣ Testing initialization...');
    await store.initialize();
    console.log('   ✅ Store initialized successfully\n');

    // Test 2: Clear any existing data
    console.log('2️⃣ Clearing existing data...');
    await store.clear();
    const countAfterClear = await store.count();
    console.log(`   ✅ Cleared. Count: ${countAfterClear}\n`);

    // Test 3: Upsert vectors
    console.log('3️⃣ Testing upsert...');
    const testVectors: Vector[] = [
      {
        id: 'test-1',
        values: [0.1, 0.2, 0.3, 0.4],
        metadata: { content: 'This is a test document about PostgreSQL', source: 'test' },
      },
      {
        id: 'test-2',
        values: [0.5, 0.6, 0.7, 0.8],
        metadata: { content: 'This is another document about databases', source: 'test' },
      },
      {
        id: 'test-3',
        values: [0.2, 0.3, 0.4, 0.5],
        metadata: { content: 'Vector search with pgvector is powerful', source: 'test' },
      },
    ];

    await store.upsert(testVectors);
    const countAfterUpsert = await store.count();
    console.log(`   ✅ Upserted ${testVectors.length} vectors. Total count: ${countAfterUpsert}\n`);

    // Test 4: Query vectors
    console.log('4️⃣ Testing query...');
    const queryVector = [0.15, 0.25, 0.35, 0.45]; // Similar to test-1
    const results = await store.query(queryVector, 2);
    console.log(`   ✅ Query returned ${results.length} results:`);
    results.forEach((result, idx) => {
      console.log(`      ${idx + 1}. ID: ${result.id}, Score: ${result.score.toFixed(4)}`);
      console.log(`         Content: ${result.content}`);
    });
    console.log('');

    // Test 5: Update existing vector
    console.log('5️⃣ Testing update (upsert existing)...');
    const updatedVector: Vector = {
      id: 'test-1',
      values: [0.9, 0.8, 0.7, 0.6],
      metadata: { content: 'Updated content for test-1', source: 'test', updated: true },
    };
    await store.upsert([updatedVector]);
    const countAfterUpdate = await store.count();
    console.log(`   ✅ Updated vector. Count remains: ${countAfterUpdate}\n`);

    // Test 6: Query after update
    console.log('6️⃣ Testing query after update...');
    const resultsAfterUpdate = await store.query([0.9, 0.8, 0.7, 0.6], 1);
    console.log(`   ✅ Top result after update:`);
    console.log(`      ID: ${resultsAfterUpdate[0].id}`);
    console.log(`      Content: ${resultsAfterUpdate[0].content}`);
    console.log(`      Score: ${resultsAfterUpdate[0].score.toFixed(4)}\n`);

    // Test 7: Delete vectors
    console.log('7️⃣ Testing delete...');
    await store.delete(['test-2']);
    const countAfterDelete = await store.count();
    console.log(`   ✅ Deleted 1 vector. Count: ${countAfterDelete}\n`);

    // Test 8: Clear all
    console.log('8️⃣ Testing clear...');
    await store.clear();
    const finalCount = await store.count();
    console.log(`   ✅ Cleared all vectors. Final count: ${finalCount}\n`);

    console.log('🎉 All tests passed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await store.close();
    console.log('🔌 Connection closed');
  }
}

// Run tests
testPostgresVectorStore().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
