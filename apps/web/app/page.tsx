'use client';

import React, { useState } from 'react';
import { FileText, Search, BarChart3, Settings } from 'lucide-react';
import Dashboard from '../components/Dashboard';
import FileUpload from '../components/FileUpload';
import QueryInterface from '../components/QueryInterface';

type TabType = 'dashboard' | 'upload' | 'query' | 'analytics';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Upload Documents', icon: FileText },
    { id: 'query', label: 'Query Documents', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ] as const;

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result);
    // Optionally switch to query tab after successful upload
    if (result.success) {
      setTimeout(() => setActiveTab('query'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">RAG Pipeline</h1>
                  <p className="text-sm text-gray-500">Document Intelligence Platform</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Powered by OpenAI & Gemini
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard />}
          
          {activeTab === 'upload' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-gray-600">
                  Upload your documents to make them searchable through semantic search.
                  Supported formats: PDF, TXT, Markdown, JSON
                </p>
              </div>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          )}
          
          {activeTab === 'query' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Query Documents</h2>
                <p className="text-gray-600">
                  Ask questions about your uploaded documents using natural language.
                  The system will find the most relevant content using AI-powered semantic search.
                </p>
              </div>
              <QueryInterface />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Insights</h2>
                <p className="text-gray-600">
                  View detailed analytics about your document collection and query patterns.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coming Soon Cards */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Analytics</h3>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Query performance metrics</p>
                    <p className="text-sm mt-2">Coming soon...</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Insights</h3>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Document analysis & clustering</p>
                    <p className="text-sm mt-2">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>RAG Pipeline Service - Powered by Next.js, OpenAI & Gemini Embeddings</p>
            <p className="mt-2">Built with TypeScript, Docker & Kubernetes</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
