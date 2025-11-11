import { NextResponse } from 'next/server';

export async function GET() {
  const RAG_API_URL = 'http://rag-api:8888';
  
  try {
    const response = await fetch(`${RAG_API_URL}/health`);
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'RAG API not available',
        status: 'offline',
        api_url: RAG_API_URL
      }, { status: 503 });
    }

    const healthData = await response.json();
    
    // Return enhanced status
    return NextResponse.json({
      status: healthData.status,
      providers: {
        vectorStore: {
          type: 'filesystem',
          vectorCount: 0
        },
        embedding: {
          model: 'gemini',
          dimension: 768
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
        node_env: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
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
    }, { status: 500 });
  }
}