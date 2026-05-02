// B2B Client Dashboard - View Analytics and Manage Keys
'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  period: { days: number; fromDate: string; toDate: string };
  plan: string;
  rateLimit: number;
  requestsToday: number;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: string;
    avgResponseTime: number;
    maxResponseTime: number;
  };
  dailyStats: any[];
  topEndpoints: any[];
}

export default function B2BDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!apiKey) return;
      try {
        const response = await fetch(`/api/analytics?days=30`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">API Analytics</h1>
          <p className="text-slate-400 mb-6">Enter your API key to view your usage analytics</p>
          <input
            type="password"
            placeholder="Enter your API key (village_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-slate-500 text-xs mt-4">Your key is only used locally and never stored.</p>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-white text-lg">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">API Analytics Dashboard</h1>
            <p className="text-slate-400">
              Plan: <span className="text-blue-400 font-semibold">{analytics.plan.toUpperCase()}</span>
            </p>
          </div>
          <button
            onClick={() => setApiKey('')}
            className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-400 rounded hover:bg-red-900 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <h3 className="text-slate-400 text-sm font-medium">Total Requests</h3>
            <p className="text-3xl font-bold text-white mt-2">{analytics.summary.totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <h3 className="text-slate-400 text-sm font-medium">Success Rate</h3>
            <p className="text-3xl font-bold text-green-400 mt-2">{analytics.summary.successRate}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <h3 className="text-slate-400 text-sm font-medium">Avg Response Time</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.summary.avgResponseTime}ms</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
            <h3 className="text-slate-400 text-sm font-medium">Requests Today</h3>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {analytics.requestsToday}/{analytics.rateLimit}
            </p>
          </div>
        </div>

        {/* Rate Limit Progress */}
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 mb-8">
          <h3 className="text-white font-semibold mb-3">Daily Rate Limit</h3>
          <div className="w-full bg-slate-800 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (analytics.requestsToday / analytics.rateLimit) * 100,
                  100
                )}%`
              }}
            />
          </div>
          <p className="text-slate-300 text-sm mt-2">
            {analytics.requestsToday} of {analytics.rateLimit} requests used today
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {['overview', 'endpoints', 'daily'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
              <h3 className="text-white font-semibold mb-4">Request Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Total Requests</span>
                  <span className="font-semibold">{analytics.summary.totalRequests}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Successful</span>
                  <span className="font-semibold text-green-400">{analytics.summary.successfulRequests}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Failed</span>
                  <span className="font-semibold text-red-400">{analytics.summary.failedRequests}</span>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between text-slate-300">
                  <span>Success Rate</span>
                  <span className="font-semibold text-blue-400">{analytics.summary.successRate}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
              <h3 className="text-white font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Avg Response Time</span>
                  <span className="font-semibold">{analytics.summary.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Max Response Time</span>
                  <span className="font-semibold text-orange-400">{analytics.summary.maxResponseTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Endpoint</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Method</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Requests</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Success</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {analytics.topEndpoints.map((endpoint, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-300 font-mono">{endpoint.endpoint}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-white font-semibold">{endpoint.requests}</td>
                      <td className="px-6 py-3 text-center text-sm text-green-400 font-semibold">{endpoint.successful}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-300">{endpoint.avg_response_time_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daily Stats Tab */}
        {activeTab === 'daily' && (
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Date</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Total</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Success</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Failed</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {analytics.dailyStats.map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-300">{new Date(day.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-center text-sm text-white font-semibold">{day.total_requests}</td>
                      <td className="px-6 py-3 text-center text-sm text-green-400 font-semibold">{day.successful_requests}</td>
                      <td className="px-6 py-3 text-center text-sm text-red-400 font-semibold">{day.failed_requests}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-300">{day.avg_response_time_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
