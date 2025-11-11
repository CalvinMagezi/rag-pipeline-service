import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const RAG_API_URL = 'http://rag-api:8888';
    const body = await request.json();
    const { query, topK = 5, minScore = 0.1 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate parameters
    if (topK < 1 || topK > 20) {
      return NextResponse.json(
        { error: 'topK must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (minScore < 0 || minScore > 1) {
      return NextResponse.json(
        { error: 'minScore must be between 0 and 1' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Send query to RAG API
    const ragResponse = await fetch(`${RAG_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        topK: parseInt(topK),
        minScore: parseFloat(minScore)
      })
    });

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text();
      console.error('RAG API query error:', errorText);
      return NextResponse.json(
        { error: 'Query processing failed' },
        { status: 500 }
      );
    }

    const ragResult = await ragResponse.json();
    const endTime = Date.now();

    // Enhance response with additional metadata
    const enhancedResult = {
      ...ragResult,
      performance: {
        request_time_ms: endTime - startTime,
        processing_time_ms: ragResult.processingTimeMs,
        total_time_ms: endTime - startTime,
        timestamp: new Date().toISOString()
      },
      query_info: {
        original_query: query,
        processed_query: query.trim(),
        parameters: {
          topK: parseInt(topK),
          minScore: parseFloat(minScore)
        }
      }
    };

    return NextResponse.json(enhancedResult);

  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}