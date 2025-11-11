import { NextRequest, NextResponse } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8888';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'text/markdown', 
      'application/pdf',
      'application/json'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'File type not supported. Please upload .txt, .md, .pdf, or .json files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Prepare metadata
    const metadata = {
      source: file.name,
      category: category,
      file_type: file.type,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_via: 'web_interface'
    };

    // Send to RAG API
    const ragResponse = await fetch(`${RAG_API_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        metadata: metadata
      })
    });

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text();
      console.error('RAG API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process document' },
        { status: 500 }
      );
    }

    const ragResult = await ragResponse.json();

    // Return success response with processing details
    return NextResponse.json({
      success: true,
      documentId: ragResult.documentId,
      chunksCreated: ragResult.chunksCreated,
      vectorsStored: ragResult.vectorsStored,
      metadata: metadata,
      processing: {
        file_name: file.name,
        file_size: file.size,
        content_length: content.length,
        category: category
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}