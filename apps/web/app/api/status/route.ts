import { NextResponse } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8888';

export async function GET() {
  try {
    const response = await fetch(`${RAG_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'RAG API not available',
          status: 'offline',
          api_url: RAG_API_URL
        },
        { status: 503 }
      );
    }

    const healthData = await response.json();

    // Enhance with additional web app information and mock provider data
    const enhancedStatus = {
      status: healthData.status,
      providers: {
        vectorStore: {
          type: 'filesystem',
          vectorCount: 0 // Would need separate endpoint to get actual count
        },
        embedding: {
          model: process.env.EMBEDDING_MODEL || 'openai',
          dimension: process.env.EMBEDDING_MODEL?.includes('gemini') ? 768 : 1536
        }
      },
      web_app: {
        status: 'online',
        version: '1.0.0',
        api_url: RAG_API_URL,
        features: [
          'file_upload',
          'real_time_query',
          'document_management',
          'analytics_dashboard'
        ]
      },
      system_info: {
        node_env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(enhancedStatus);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check system status',
        status: 'error',
        providers: {
          vectorStore: { type: 'unknown', vectorCount: 0 },
          embedding: { model: 'unknown', dimension: 0 }
        },
        web_app: {
          status: 'online',
          api_status: 'offline'
        }
      },
      { status: 500 }
    );
  }
}