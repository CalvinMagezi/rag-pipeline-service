'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Database, Cpu, Clock, Users, TrendingUp, RefreshCw } from 'lucide-react';

interface SystemStatus {
  status: string;
  providers: {
    vectorStore: {
      type: string;
      vectorCount: number;
    };
    embedding: {
      model: string;
      dimension: number;
    };
  };
  web_app?: {
    status: string;
    features: string[];
  };
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch status');
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Unable to fetch system status</p>
          <button
            onClick={fetchStatus}
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isHealthy = status.status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Dashboard</h2>
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStatus}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className={`text-lg font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {isHealthy ? 'Healthy' : 'Offline'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className={`h-6 w-6 ${isHealthy ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isHealthy ? 'All systems operational' : 'System unavailable'}
            </span>
          </div>
        </div>

        {/* Document Count */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents Indexed</p>
              <p className="text-lg font-semibold text-gray-900">
                {status.providers.vectorStore.vectorCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              Vector Store: {status.providers.vectorStore.type}
            </span>
          </div>
        </div>

        {/* Embedding Model */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Embedding Model</p>
              <p className="text-lg font-semibold text-gray-900">
                {status.providers.embedding.model.split('-').slice(-1)[0]}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {status.providers.embedding.dimension}D vectors
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Web Features</p>
              <p className="text-lg font-semibold text-gray-900">
                {status.web_app?.features?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              Web App: {status.web_app?.status || 'unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Details */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">RAG API Status:</dt>
              <dd className={`text-sm font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {status.status}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Vector Store:</dt>
              <dd className="text-sm text-gray-900">{status.providers.vectorStore.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Embedding Provider:</dt>
              <dd className="text-sm text-gray-900">{status.providers.embedding.model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Vector Dimensions:</dt>
              <dd className="text-sm text-gray-900">{status.providers.embedding.dimension}</dd>
            </div>
          </dl>
        </div>

        {/* Features List */}
        {status.web_app?.features && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
            <div className="space-y-2">
              {status.web_app.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}