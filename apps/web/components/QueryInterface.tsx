'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, Target, FileText, TrendingUp, Loader2 } from 'lucide-react';

interface QueryResult {
  id: string;
  score: number;
  content: string;
  metadata: any;
}

interface QueryResponse {
  success: boolean;
  query: string;
  results: QueryResult[];
  totalResults: number;
  processingTimeMs: number;
  performance?: {
    request_time_ms: number;
    total_time_ms: number;
  };
  error?: string;
}

export default function QueryInterface() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0.1);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  // Load query history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rag_query_history');
    if (saved) {
      setQueryHistory(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setIsQuerying(true);
    setQueryResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          topK: topK,
          minScore: minScore
        }),
      });

      const result = await response.json();
      setQueryResult(result);

      // Add to query history
      if (result.success) {
        const newHistory = [query.trim(), ...queryHistory.filter(q => q !== query.trim())].slice(0, 10);
        setQueryHistory(newHistory);
        localStorage.setItem('rag_query_history', JSON.stringify(newHistory));
      }

    } catch (error) {
      console.error('Query error:', error);
      setQueryResult({
        success: false,
        query: query,
        results: [],
        totalResults: 0,
        processingTimeMs: 0,
        error: 'Network error occurred during query'
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const quickQueries = [
    'What is machine learning?',
    'How does Kubernetes work?',
    'Startup funding stages',
    'Climate change impacts',
    'Neural networks explained'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="space-y-4">
          {/* Main Query Input */}
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              Ask a Question
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your uploaded documents..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={isQuerying}
              />
            </div>
          </div>

          {/* Query Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="topK" className="block text-sm font-medium text-gray-700 mb-1">
                Max Results
              </label>
              <select
                id="topK"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isQuerying}
              >
                <option value={3}>3 results</option>
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
              </select>
            </div>

            <div>
              <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Similarity
              </label>
              <select
                id="minScore"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isQuerying}
              >
                <option value={0.0}>Any similarity (0.0)</option>
                <option value={0.1}>Low threshold (0.1)</option>
                <option value={0.3}>Medium threshold (0.3)</option>
                <option value={0.5}>High threshold (0.5)</option>
                <option value={0.7}>Very high threshold (0.7)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isQuerying ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Searching...
              </>
            ) : (
              <>
                <Search className="-ml-1 mr-3 h-5 w-5" />
                Search Documents
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Query Buttons */}
      {queryHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Queries</h3>
          <div className="flex flex-wrap gap-2">
            {queryHistory.slice(0, 5).map((historyQuery, index) => (
              <button
                key={index}
                onClick={() => setQuery(historyQuery)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {historyQuery.length > 30 ? `${historyQuery.slice(0, 30)}...` : historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Queries</h3>
        <div className="flex flex-wrap gap-2">
          {quickQueries.map((quickQuery) => (
            <button
              key={quickQuery}
              onClick={() => setQuery(quickQuery)}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              disabled={isQuerying}
            >
              {quickQuery}
            </button>
          ))}
        </div>
      </div>

      {/* Query Results */}
      {queryResult && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className={`p-4 rounded-lg ${queryResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-medium ${queryResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {queryResult.success ? 'Query Results' : 'Query Failed'}
                </h3>
                <p className={`text-sm ${queryResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  "{queryResult.query}"
                </p>
              </div>
              
              {queryResult.success && (
                <div className="flex items-center space-x-4 text-sm text-green-700">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {queryResult.totalResults} results
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {queryResult.processingTimeMs}ms
                  </div>
                </div>
              )}
            </div>

            {!queryResult.success && queryResult.error && (
              <p className="text-sm text-red-700 mt-2">{queryResult.error}</p>
            )}
          </div>

          {/* Results List */}
          {queryResult.success && queryResult.results.length > 0 && (
            <div className="space-y-4">
              {queryResult.results.map((result, index) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        #{index + 1}
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-1" />
                        {result.metadata.source || 'Unknown Source'}
                      </div>
                      {result.metadata.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {result.metadata.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      <span className="font-medium text-green-600">
                        {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-800 leading-relaxed">{result.content}</p>

                  {result.metadata.documentId && (
                    <div className="mt-3 text-xs text-gray-500">
                      Document ID: {result.metadata.documentId.substring(0, 8)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {queryResult.success && queryResult.results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents found matching your query.</p>
              <p className="text-sm mt-2">Try adjusting your search terms or lowering the similarity threshold.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}