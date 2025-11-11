'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  success: boolean;
  documentId?: string;
  chunksCreated?: number;
  vectorsStored?: number;
  metadata?: any;
  processing?: any;
  error?: string;
}

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [category, setCategory] = useState('general');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [category]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [category]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      setUploadResult(result);
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: 'Network error occurred during upload'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Document Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isUploading}
        >
          <option value="general">General</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="science">Science</option>
          <option value="legal">Legal</option>
          <option value="medical">Medical</option>
        </select>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : isUploading 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept=".txt,.md,.pdf,.json"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-gray-700">Processing your document...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your files here, or{' '}
                  <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: .txt, .md, .pdf, .json (Max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadResult && (
        <div className={`mt-6 p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start">
            {uploadResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              {uploadResult.success ? (
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-2">
                    Document uploaded successfully!
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Document ID:</strong> {uploadResult.documentId}</p>
                    <p><strong>Chunks Created:</strong> {uploadResult.chunksCreated}</p>
                    <p><strong>Vectors Stored:</strong> {uploadResult.vectorsStored}</p>
                    {uploadResult.processing && (
                      <>
                        <p><strong>File Size:</strong> {Math.round(uploadResult.processing.file_size / 1024)} KB</p>
                        <p><strong>Content Length:</strong> {uploadResult.processing.content_length?.toLocaleString()} characters</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Upload failed
                  </h3>
                  <p className="text-sm text-red-700">{uploadResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}